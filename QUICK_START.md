# 🚀 Quick Start Guide

دليل البدء السريع لتشغيل المشروع بالـ Docker في 5 دقائق

## ⚡ التشغيل السريع (3 خطوات)

### 1️⃣ تحضير البيئة

```bash
# انسخ ملف البيئة
cp .env.docker .env

# عدل القيم المطلوبة (JWT secrets و R2 credentials)
nano .env
```

### 2️⃣ تشغيل المشروع

```bash
# باستخدام Makefile (موصى به)
make build
make up
make migrate
make seed

# أو بدون Makefile
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

### 3️⃣ افتح المتصفح

- API: http://localhost:5000
- API Docs: http://localhost:5000/api
- Health Check: http://localhost:5000/health

## 🎯 اختبار سريع

```bash
# اختبار الـ API
curl http://localhost:5000/health

# Login بالـ admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**بيانات الـ Admin الافتراضية:**
- Email: `admin@example.com`
- Password: `admin123`

## 📋 أوامر مفيدة

```bash
# عرض الـ logs
make logs              # جميع الخدمات
make logs-backend      # Backend فقط
make logs-db          # Database فقط

# الدخول للـ shell
make shell            # Backend shell
make db-shell         # Database shell

# إدارة البيانات
make backup           # عمل backup للقاعدة
make restore          # استرجاع backup
make clean            # حذف كل شيء

# إعادة البناء
make rebuild          # إعادة بناء كاملة
```

## 🛠 Development Mode

```bash
# تشغيل مع hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# أو
make dev
```

## 📊 أدوات إضافية

### PgAdmin (إدارة القاعدة)

```bash
# تشغيل مع PgAdmin
docker-compose --profile tools up -d
```

افتح: http://localhost:5050
- Email: `admin@admin.com`
- Password: `admin`

### Prisma Studio (UI للقاعدة)

```bash
make studio
# أو
docker-compose exec backend npx prisma studio
```

## 🔐 إعدادات الأمان

**⚠️ مهم جداً قبل Production:**

1. **غير الـ JWT secrets في `.env`:**
```bash
# استخدم هذا الأمر لتوليد secret قوي
openssl rand -base64 32
```

2. **غير بيانات PostgreSQL:**
```yaml
# في docker-compose.yml
POSTGRES_PASSWORD: استخدم_كلمة_مرور_قوية
```

3. **ضبط الـ CORS:**
```bash
# في .env
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🐛 حل المشاكل الشائعة

### البرنامج لا يشتغل

```bash
# تحقق من الـ logs
docker-compose logs backend

# تحقق من حالة الخدمات
docker-compose ps
```

### Database connection error

```bash
# أعد تشغيل PostgreSQL
docker-compose restart postgres

# تحقق من الاتصال
docker-compose exec postgres pg_isready
```

### Port 5000 محجوز

```bash
# غير الـ port في docker-compose.yml
ports:
  - "5001:5000"  # استخدم port مختلف
```

### Prisma errors

```bash
# أعد إنشاء القاعدة
docker-compose down -v
docker-compose up -d
make migrate
```

## 📁 البنية الأساسية

```
news-backend-2/
├── Dockerfile              # بناء الـ image
├── docker-compose.yml      # تعريف الخدمات
├── docker-compose.dev.yml  # إعدادات development
├── .dockerignore          # استثناءات Docker
├── .env.docker            # مثال لمتغيرات البيئة
├── Makefile               # أوامر مختصرة
├── nginx/
│   └── nginx.conf         # إعدادات Nginx
└── .github/
    └── workflows/
        └── docker.yml     # CI/CD workflow
```

## 🌐 نشر المشروع (Production)

### 1. على VPS خاص بك

```bash
# على السيرفر
git clone <your-repo>
cd news-backend-2
cp .env.docker .env
# عدل .env بالبيانات الحقيقية
make build
make prod
```

### 2. على Railway / Render

- ارفع Docker image على Docker Hub أو GitHub Registry
- اربط الريبو بالمنصة
- ضبط الـ environment variables
- Deploy

### 3. على AWS / DigitalOcean

- استخدم Docker Compose أو Kubernetes
- ضبط Load Balancer
- استخدم RDS للـ database

## 📞 الدعم

- افتح issue على GitHub
- راجع [DOCKER.md](./DOCKER.md) للتفاصيل الكاملة
- شوف الـ logs: `make logs`

## ✅ Checklist قبل Production

- [ ] غيرت JWT secrets
- [ ] غيرت كلمة مرور PostgreSQL
- [ ] ضبطت CORS للدومين الحقيقي
- [ ] فعلت HTTPS
- [ ] ضبطت Cloudflare R2
- [ ] اختبرت الـ backup والـ restore
- [ ] ضبطت monitoring
- [ ] فعلت rate limiting
- [ ] راجعت الـ logs

---

**🎉 تم! مشروعك دلوقتي جاهز للاستخدام**