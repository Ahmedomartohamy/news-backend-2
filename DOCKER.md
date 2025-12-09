# Docker Setup Guide

دليل شامل لتشغيل المشروع باستخدام Docker

## 📋 المتطلبات الأساسية

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM على الأقل
- 5GB مساحة تخزين فارغة

## 🚀 التشغيل السريع

### 1. تحضير ملف البيئة

```bash
# انسخ ملف البيئة
cp .env.docker .env

# عدل القيم في .env حسب احتياجك
nano .env
```

### 2. بناء وتشغيل الـ containers

```bash
# بناء وتشغيل جميع الخدمات
docker-compose up -d

# أو بناء من جديد
docker-compose up -d --build
```

### 3. تشغيل migrations وseeding

```bash
# تشغيل migrations
docker-compose exec backend npx prisma migrate deploy

# إضافة بيانات تجريبية (اختياري)
docker-compose exec backend npx prisma db seed
```

### 4. التحقق من التشغيل

```bash
# عرض حالة الـ containers
docker-compose ps

# عرض logs
docker-compose logs -f backend
```

الـ API سيكون متاح على: `http://localhost:5000`

## 📦 الخدمات المتاحة

| الخدمة | Port | الوصف |
|--------|------|-------|
| **backend** | 5000 | Node.js API Server |
| **postgres** | 5432 | PostgreSQL Database |
| **pgadmin** | 5050 | Database Admin UI (optional) |
| **nginx** | 80/443 | Reverse Proxy (optional) |

## 🔧 الأوامر الأساسية

### إدارة الـ Containers

```bash
# تشغيل الخدمات
docker-compose up -d

# إيقاف الخدمات
docker-compose stop

# إيقاف وحذف الـ containers
docker-compose down

# حذف مع الـ volumes (تحذير: سيحذف البيانات!)
docker-compose down -v

# إعادة تشغيل خدمة معينة
docker-compose restart backend

# إعادة بناء وتشغيل
docker-compose up -d --build
```

### عرض Logs

```bash
# عرض logs لجميع الخدمات
docker-compose logs -f

# عرض logs لخدمة معينة
docker-compose logs -f backend
docker-compose logs -f postgres

# عرض آخر 100 سطر
docker-compose logs --tail=100 backend
```

### تنفيذ أوامر داخل الـ Container

```bash
# الدخول إلى backend container
docker-compose exec backend sh

# تنفيذ أمر Prisma
docker-compose exec backend npx prisma studio

# تشغيل migration جديد
docker-compose exec backend npx prisma migrate dev --name init

# عرض database schema
docker-compose exec backend npx prisma db pull
```

### إدارة قاعدة البيانات

```bash
# الاتصال بـ PostgreSQL
docker-compose exec postgres psql -U postgres -d news_db

# عمل backup للقاعدة
docker-compose exec postgres pg_dump -U postgres news_db > backup.sql

# استرجاع backup
docker-compose exec -T postgres psql -U postgres news_db < backup.sql
```

## 🛠 خيارات التشغيل

### التشغيل في Development Mode

```bash
# تشغيل مع hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### التشغيل مع PgAdmin

```bash
# تشغيل backend و database و pgadmin
docker-compose --profile tools up -d
```

افتح PgAdmin على: `http://localhost:5050`
- Email: `admin@admin.com`
- Password: `admin`

### التشغيل مع Nginx

```bash
# تشغيل مع reverse proxy
docker-compose --profile production up -d
```

## 🔐 الأمان

### تغيير كلمات المرور الافتراضية

في ملف `.env`:

```bash
# غير هذه القيم في Production
JWT_SECRET=استخدم-قيمة-عشوائية-قوية-جداً
JWT_REFRESH_SECRET=استخدم-قيمة-عشوائية-أخرى
```

لإنشاء قيمة عشوائية قوية:

```bash
# Linux/Mac
openssl rand -base64 32

# أو
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### تغيير بيانات PostgreSQL

في ملف `docker-compose.yml`:

```yaml
environment:
  POSTGRES_USER: your_user
  POSTGRES_PASSWORD: your_secure_password
  POSTGRES_DB: your_db_name
```

## 🐛 استكشاف الأخطاء

### المشكلة: Container يتوقف فوراً

```bash
# عرض الـ logs
docker-compose logs backend

# التحقق من الـ exit code
docker-compose ps
```

### المشكلة: Database connection error

```bash
# التحقق من تشغيل PostgreSQL
docker-compose ps postgres

# اختبار الاتصال
docker-compose exec postgres pg_isready -U postgres

# التحقق من DATABASE_URL
docker-compose exec backend env | grep DATABASE_URL
```

### المشكلة: Prisma migration errors

```bash
# إعادة إنشاء القاعدة من البداية
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

### المشكلة: Port already in use

```bash
# تغيير الـ port في docker-compose.yml
ports:
  - "5001:5000"  # استخدم port مختلف

# أو إيقاف الخدمة التي تستخدم الـ port
lsof -ti:5000 | xargs kill -9  # Linux/Mac
```

## 📊 المراقبة

### عرض استهلاك الموارد

```bash
# عرض استخدام CPU و Memory
docker stats

# عرض لخدمة معينة
docker stats news_backend
```

### Health Check

```bash
# التحقق من صحة الـ backend
curl http://localhost:5000/health

# أو
docker-compose exec backend wget -qO- http://localhost:5000/health
```

## 🔄 التحديثات

### تحديث الكود

```bash
# سحب آخر تحديثات من Git
git pull origin main

# إعادة البناء والتشغيل
docker-compose up -d --build backend
```

### تحديث Dependencies

```bash
# داخل الـ container
docker-compose exec backend npm update

# أو أعد بناء الـ image
docker-compose build --no-cache backend
```

## 🗑 التنظيف

### حذف كل شيء

```bash
# إيقاف وحذف containers و volumes
docker-compose down -v

# حذف images
docker rmi news-backend-2_backend

# تنظيف Docker بالكامل (تحذير!)
docker system prune -a --volumes
```

### حذف البيانات فقط

```bash
# حذف الـ volumes فقط
docker volume rm news-backend-2_postgres_data
docker volume rm news-backend-2_pgadmin_data
```

## 📝 الملاحظات

### Production Checklist

- [ ] غير `JWT_SECRET` و `JWT_REFRESH_SECRET`
- [ ] غير كلمة مرور PostgreSQL
- [ ] استخدم HTTPS في Production
- [ ] فعّل الـ firewall
- [ ] قلل عدد الـ restart attempts
- [ ] استخدم environment variables management
- [ ] فعّل monitoring و logging
- [ ] اعمل backup منتظم للقاعدة

### تحسين الأداء

```yaml
# في docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 🔗 روابط مفيدة

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

## 🆘 الحصول على المساعدة

إذا واجهت أي مشاكل:

1. تحقق من الـ logs: `docker-compose logs -f`
2. راجع الـ environment variables
3. تأكد من تشغيل جميع الخدمات: `docker-compose ps`
4. افتح issue على GitHub