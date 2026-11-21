import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import supabase from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

const app = express();
// Cloud Run injects process.env.PORT (default 8080); Vercel defaults to 80; fallback to 3001 for local dev
const PORT = parseInt(process.env.PORT || (process.env.NODE_ENV === 'production' ? '80' : '3001'), 10);

app.use(cors());

// ─── Body parsing with error handling for malformed JSON ───
app.use((req, res, next) => {
  express.json({ limit: '100kb' })(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: err.type === 'entity.parse.failed'
          ? 'Request body contains invalid JSON'
          : err.message,
      });
    }
    next();
  });
});

// ─── Health check endpoint (for Cloud Run / Kubernetes / load balancers) ───
app.get('/api/health', async (_req, res) => {
  try {
    const { count, error } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true });

    res.json({
      status: error ? 'degraded' : 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
      db: error ? `error: ${error.message}` : 'connected',
    });
  } catch (err) {
    res.status(503).json({ status: 'error', error: err.message });
  }
});

// ─── Helpers ───
const VALID_CATEGORIES = ['Lab Notes', 'Cloud Checklist', 'Study Resource'];
const VALID_WEEK_PATTERN = /^Week ([1-9]|1[0-4])$/;

function validateUrl(url) {
  if (!url) return true; // optional
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitize(str) {
  return (str || '').trim();
}

function validateResource(body, partial = false) {
  const errors = {};

  if (!partial || body.title !== undefined) {
    const title = sanitize(body.title);
    if (!title) errors.title = 'Title is required';
    else if (title.length < 3) errors.title = 'Title must be at least 3 characters';
    else if (title.length > 120) errors.title = 'Title must be under 120 characters';
  }

  if (!partial || body.course !== undefined) {
    const course = sanitize(body.course);
    if (!course) errors.course = 'Course or tag is required';
    else if (course.length > 60) errors.course = 'Course must be under 60 characters';
  }

  if (!partial || body.category !== undefined) {
    if (body.category && !VALID_CATEGORIES.includes(body.category)) {
      errors.category = `Category must be one of: ${VALID_CATEGORIES.join(', ')}`;
    }
  }

  if (!partial || body.week !== undefined) {
    if (body.week && !VALID_WEEK_PATTERN.test(body.week)) {
      errors.week = 'Week must be in format "Week 1" through "Week 14"';
    }
  }

  if (!partial || body.link !== undefined) {
    if (body.link && !validateUrl(body.link.trim())) {
      errors.link = 'Link must be a valid URL starting with http:// or https://';
    }
  }

  if (body.notes && body.notes.length > 5000) {
    errors.notes = 'Notes must be under 5000 characters';
  }

  if (body.snippet && body.snippet.length > 5000) {
    errors.snippet = 'Snippet must be under 5000 characters';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

// ─── GET /api/resources ───
app.get('/api/resources', async (req, res) => {
  try {
    const { q, category, week } = req.query;

    let query = supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      query = query.or(
        `title.ilike.${term},course.ilike.${term},notes.ilike.${term},snippet.ilike.${term}`
      );
    }

    if (category && category !== 'All') {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Invalid category filter', field: 'category' });
      }
      query = query.eq('category', category);
    }

    if (week && week !== 'All') {
      query = query.eq('week', week);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('GET /api/resources error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/resources/meta ───
app.get('/api/resources/meta', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('week, course');

    if (error) throw error;

    const weeks = [...new Set(data.map(r => r.week))].sort();
    const courses = [...new Set(data.map(r => r.course))].sort();
    res.json({ weeks, courses });
  } catch (err) {
    console.error('GET /api/resources/meta error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/resources/:id ───
app.get('/api/resources/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(data);
  } catch (err) {
    console.error('GET /api/resources/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/resources ───
app.post('/api/resources', async (req, res) => {
  try {
    const fieldErrors = validateResource(req.body);
    if (fieldErrors) {
      return res.status(400).json({ error: 'Validation failed', fields: fieldErrors });
    }

    const resource = {
      id: crypto.randomUUID(),
      title: sanitize(req.body.title),
      course: sanitize(req.body.course),
      week: req.body.week || 'Week 1',
      category: req.body.category || 'Lab Notes',
      notes: sanitize(req.body.notes),
      link: sanitize(req.body.link),
      snippet: sanitize(req.body.snippet),
      created_at: Date.now(),
    };

    const { data, error } = await supabase
      .from('resources')
      .insert(resource)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('POST /api/resources error:', err);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// ─── PUT /api/resources/:id ───
app.put('/api/resources/:id', async (req, res) => {
  try {
    // Check if resource exists
    const { data: existing, error: fetchError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const fieldErrors = validateResource(req.body, true);
    if (fieldErrors) {
      return res.status(400).json({ error: 'Validation failed', fields: fieldErrors });
    }

    const updated = {
      title:    sanitize(req.body.title    ?? existing.title),
      course:   sanitize(req.body.course   ?? existing.course),
      week:     req.body.week              ?? existing.week,
      category: req.body.category          ?? existing.category,
      notes:    sanitize(req.body.notes    ?? existing.notes),
      link:     sanitize(req.body.link     ?? existing.link),
      snippet:  sanitize(req.body.snippet  ?? existing.snippet),
    };

    const { data, error } = await supabase
      .from('resources')
      .update(updated)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('PUT /api/resources/:id error:', err);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

// ─── DELETE /api/resources/:id ───
app.delete('/api/resources/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .delete()
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error('DELETE /api/resources/:id error:', err);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// ─── Serve Built Frontend in Production ───
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback for frontend client-side routing (Universal for Express 4 & 5)
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// ─── 404 handler for API routes ───
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ─── Global error handler ───
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// ─── Server Startup (bind to 0.0.0.0 for containerized environments) ───
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 CampusDrop server running at http://0.0.0.0:${PORT}`);
  console.log(`   Dynamic Port: process.env.PORT = ${process.env.PORT || '(unset, fallback to 3001)'}`);
  console.log(`   Health Check: http://0.0.0.0:${PORT}/api/health`);
  if (fs.existsSync(distPath)) {
    console.log(`   Static UI:    Serving production build from ${distPath}`);
  }
  console.log();
});

// ─── Graceful Shutdown (Cloud Run sends SIGTERM on scale-down/rotation) ───
function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Initiating graceful shutdown...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown if connections do not close within 8s (Cloud Run gives 10s)
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 8000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
