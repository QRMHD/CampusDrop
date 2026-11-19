import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'campusdrop.db');

// Ensure database directory exists (useful for container volumes e.g. /app/data)
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───
db.exec(`
  CREATE TABLE IF NOT EXISTS resources (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    course      TEXT NOT NULL,
    week        TEXT NOT NULL,
    category    TEXT NOT NULL CHECK(category IN ('Lab Notes', 'Cloud Checklist', 'Study Resource')),
    notes       TEXT DEFAULT '',
    link        TEXT DEFAULT '',
    snippet     TEXT DEFAULT '',
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
  CREATE INDEX IF NOT EXISTS idx_resources_week     ON resources(week);
  CREATE INDEX IF NOT EXISTS idx_resources_course   ON resources(course);
`);

// ─── Seed data (only if table is empty) ───
const count = db.prepare('SELECT COUNT(*) AS n FROM resources').get().n;

if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO resources (id, title, course, week, category, notes, link, snippet, created_at)
    VALUES (@id, @title, @course, @week, @category, @notes, @link, @snippet, @created_at)
  `);

  const seeds = [
    {
      id: 'seed-1',
      title: 'AWS S3 Bucket Policy & IAM Roles Lab',
      course: 'CS301 Cloud Computing',
      week: 'Week 2',
      category: 'Lab Notes',
      notes: 'Hands-on lab covering S3 bucket creation, writing JSON bucket policies, configuring IAM roles for cross-account access, and enabling versioning. Key takeaway: always follow least-privilege principle.',
      link: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html',
      snippet: 'aws s3api put-bucket-policy --bucket my-lab-bucket --policy file://policy.json\naws iam create-role --role-name S3ReadOnlyRole --assume-role-policy-document file://trust.json',
      created_at: Date.now() - 86400000 * 6,
    },
    {
      id: 'seed-2',
      title: 'Docker Multi-Stage Build Checklist',
      course: 'CS301 Cloud Computing',
      week: 'Week 4',
      category: 'Cloud Checklist',
      notes: '✅ Use slim/alpine base images to reduce attack surface\n✅ Separate build stage from runtime stage\n✅ Copy only compiled artifacts into final image\n✅ Set non-root USER in production stage\n✅ Add .dockerignore for node_modules, .git, .env\n✅ Tag images with commit SHA, not just "latest"\n✅ Scan image with `docker scout` before pushing',
      link: 'https://docs.docker.com/build/building/multi-stage/',
      snippet: '# Build stage\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build\n\n# Production stage\nFROM node:20-alpine\nWORKDIR /app\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nUSER node\nEXPOSE 3000\nCMD ["node", "dist/index.js"]',
      created_at: Date.now() - 86400000 * 4,
    },
    {
      id: 'seed-3',
      title: 'Kubernetes Pod Debugging & Logs Lab',
      course: 'CS301 Cloud Computing',
      week: 'Week 6',
      category: 'Lab Notes',
      notes: 'Lab walkthrough: deploy a crashing pod, use kubectl to inspect events, read container logs, exec into running containers, and fix common issues (ImagePullBackOff, CrashLoopBackOff, OOMKilled). Practice with resource limits and liveness probes.',
      link: 'https://kubernetes.io/docs/tasks/debug/',
      snippet: 'kubectl get pods -n lab-ns\nkubectl describe pod failing-app -n lab-ns\nkubectl logs failing-app -n lab-ns --previous\nkubectl exec -it failing-app -n lab-ns -- /bin/sh\nkubectl top pod -n lab-ns',
      created_at: Date.now() - 86400000 * 2,
    },
    {
      id: 'seed-4',
      title: 'Terraform VPC + Subnet Design Guide',
      course: 'CS301 Cloud Computing',
      week: 'Week 5',
      category: 'Study Resource',
      notes: 'Reference guide for designing a production-grade VPC in AWS using Terraform. Covers CIDR planning, public vs private subnets, NAT gateways, route tables, and security group best practices. Final exam topic — know the difference between NACLs and Security Groups.',
      link: 'https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc',
      snippet: 'resource "aws_vpc" "main" {\n  cidr_block           = "10.0.0.0/16"\n  enable_dns_hostnames = true\n  tags = { Name = "lab-vpc" }\n}\n\nresource "aws_subnet" "public" {\n  vpc_id                  = aws_vpc.main.id\n  cidr_block              = "10.0.1.0/24"\n  map_public_ip_on_launch = true\n  availability_zone       = "us-east-1a"\n}',
      created_at: Date.now() - 86400000 * 3,
    },
    {
      id: 'seed-5',
      title: 'CI/CD Pipeline with GitHub Actions',
      course: 'CS301 Cloud Computing',
      week: 'Week 7',
      category: 'Cloud Checklist',
      notes: '✅ Create .github/workflows/ci.yml in repo root\n✅ Trigger on push to main and pull_request events\n✅ Run linting and unit tests in parallel jobs\n✅ Build Docker image only after tests pass\n✅ Push image to container registry with SHA tag\n✅ Deploy to staging automatically, production on manual approval\n✅ Add status badges to README',
      link: 'https://docs.github.com/en/actions/quickstart',
      snippet: 'name: CI/CD Pipeline\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 20 }\n      - run: npm ci\n      - run: npm test',
      created_at: Date.now() - 86400000,
    },
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });

  insertMany(seeds);
  console.log(`✅ Seeded ${seeds.length} resources into database`);
}

export default db;
