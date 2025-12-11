# Wallet Service API

A comprehensive backend wallet service built with NestJS that allows users to deposit money using Paystack, manage wallet balances, view transaction history, and transfer funds to other users.

## 🌟 Features

### Core Functionality
- ✅ **Google OAuth Authentication** - Secure user sign-in with Google
- ✅ **Automatic Wallet Creation** - Each user gets a unique 13-digit wallet number
- ✅ **Paystack Integration** - Seamless deposit processing with Paystack
- ✅ **Secure Webhooks** - HMAC signature verification for Paystack events
- ✅ **Wallet-to-Wallet Transfers** - Send money between users instantly
- ✅ **Transaction History** - Complete audit trail of all operations
- ✅ **Dual Authentication** - Support for JWT tokens and API keys

### API Key Management
- ✅ **Service-to-Service Access** - Generate API keys for external services
- ✅ **Permission-Based Access Control** - Fine-grained permissions (deposit, transfer, read)
- ✅ **Key Expiration** - Automatic expiry with configurable durations (1H, 1D, 1M, 1Y)
- ✅ **Key Rollover** - Seamlessly replace expired keys
- ✅ **Maximum 5 Active Keys** - Security limit per user

### Security & Reliability
- ✅ **Idempotent Operations** - Prevent duplicate transactions
- ✅ **Atomic Transfers** - Database transactions ensure consistency
- ✅ **Transfer Limits** - Min/max per transaction and daily limits
- ✅ **Webhook Signature Verification** - HMAC SHA-512 validation
- ✅ **Input Validation** - Request body validation with class-validator
- ✅ **Error Handling** - Comprehensive error responses

### Documentation
- ✅ **Swagger/OpenAPI** - Interactive API documentation
- ✅ **Complete Examples** - Request/response samples for all endpoints
- ✅ **Try It Out** - Test APIs directly from browser

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [API Endpoints](#-api-endpoints)
- [Authentication](#-authentication)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Security Considerations](#-security-considerations)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🛠 Tech Stack

- **Framework:** NestJS 10.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 15+
- **ORM:** TypeORM
- **Authentication:** Passport (Google OAuth 2.0, JWT)
- **Payment Gateway:** Paystack
- **Documentation:** Swagger/OpenAPI
- **Validation:** class-validator, class-transformer
- **Security:** bcrypt, crypto (HMAC)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x
- **npm** >= 9.x or **yarn** >= 1.22.x
- **PostgreSQL** >= 15.x
- **Git**

You'll also need accounts and credentials for:

- **Google Cloud Console** (for OAuth)
- **Paystack** (for payment processing)

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/wallet-service.git
cd wallet-service
```

### 2. Install Dependencies
```bash
npm install
```

Or with yarn:
```bash
yarn install
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Update the `.env` file with your credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_database_password
DB_NAME=wallet_service

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRATION=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# Application Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Select **Web Application**
6. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

### Getting Paystack Credentials

1. Sign up at [Paystack](https://paystack.com/)
2. Go to **Settings** → **API Keys & Webhooks**
3. Copy your **Test Secret Key** and **Test Public Key**
4. For production, use **Live Keys**

---

## 💾 Database Setup

### 1. Create Database
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE wallet_service;

# Exit
\q
```

### 2. Run Migrations

The application uses TypeORM with `synchronize: true` in development, so tables will be created automatically on first run.

**⚠️ Important:** For production, set `synchronize: false` and use migrations:
```bash
# Generate migration
npm run migration:generate -- src/migrations/InitialSchema

# Run migrations
npm run migration:run
```

---

## ▶️ Running the Application

### Development Mode
```bash
npm run start:dev
```

The API will be available at: `http://localhost:3000`

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Using Docker
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## 📚 API Documentation

### Swagger UI

Once the application is running, access the interactive API documentation:
```
http://localhost:3000/api/docs
```

### Swagger JSON

Get the OpenAPI specification:
```
http://localhost:3000/api/docs-json
```

### Features:
- 🔍 Interactive endpoint testing
- 📝 Complete request/response schemas
- 🔐 Built-in authentication testing
- 📋 Copy-paste ready examples
- 🎨 Clean, modern UI

---

## 🛣 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/auth/google` | Initiate Google OAuth | None |
| GET | `/auth/google/callback` | OAuth callback | None |

### API Keys

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/keys/create` | Create new API key | JWT |
| GET | `/keys` | List all API keys | JWT |
| POST | `/keys/rollover` | Rollover expired key | JWT |
| DELETE | `/keys/:id` | Revoke API key | JWT |

### Wallet Operations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/wallet/balance` | Get wallet balance | JWT / API Key (read) |
| POST | `/wallet/deposit` | Initialize deposit | JWT / API Key (deposit) |
| GET | `/wallet/deposit/:reference/status` | Check deposit status | JWT / API Key (read) |
| GET | `/wallet/lookup/:walletNumber` | Lookup wallet | JWT / API Key (read) |
| POST | `/wallet/transfer` | Transfer funds | JWT / API Key (transfer) |
| GET | `/wallet/transactions` | Get transaction history | JWT / API Key (read) |
| GET | `/wallet/transaction/:reference` | Get transaction details | JWT / API Key (read) |

### Webhooks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/wallet/paystack/webhook` | Paystack webhook handler | Signature |

### Health

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check | None |

---

## 🔑 Authentication

This API supports two authentication methods:

### 1. JWT Authentication (for users)

**How to use:**

1. Sign in with Google:
```
   GET http://localhost:3000/auth/google
```

2. Get JWT token from callback response

3. Include in requests:
```
   Authorization: Bearer <your-jwt-token>
```

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/wallet/balance
```

### 2. API Key Authentication (for services)

**How to use:**

1. Create API key (requires JWT):
```bash
   curl -X POST http://localhost:3000/keys/create \
     -H "Authorization: Bearer YOUR_JWT" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "my-service",
       "permissions": ["deposit", "transfer", "read"],
       "expiry": "1M"
     }'
```

2. Include in requests:
```
   x-api-key: <your-api-key>
```

**Example:**
```bash
curl -H "x-api-key: sk_live_abc123..." \
  http://localhost:3000/wallet/balance
```

### API Key Permissions

- `deposit` - Can initialize deposits
- `transfer` - Can transfer funds
- `read` - Can view balance and transactions

**Rules:**
- Maximum 5 active API keys per user
- Keys expire based on configured duration
- Expired keys can be rolled over
- Revoked keys cannot be used

---

## 🧪 Testing

### Quick Test (Swagger UI)

1. Start the server: `npm run start:dev`
2. Open: `http://localhost:3000/api/docs`
3. Click **"Authorize"** button
4. Sign in with Google to get JWT token
5. Paste token and test endpoints

### Complete Test Flow
```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Sign in (open in browser)
# Visit: http://localhost:3000/auth/google

# 3. Create API key
curl -X POST http://localhost:3000/keys/create \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-key",
    "permissions": ["deposit", "transfer", "read"],
    "expiry": "1D"
  }'

# 4. Check balance
curl http://localhost:3000/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT"

# 5. Initialize deposit
curl -X POST http://localhost:3000/wallet/deposit \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000}'

# 6. Visit Paystack URL to complete payment

# 7. Check balance after webhook
curl http://localhost:3000/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT"

# 8. Lookup recipient wallet
curl http://localhost:3000/wallet/lookup/1234567890123 \
  -H "Authorization: Bearer YOUR_JWT"

# 9. Transfer funds
curl -X POST http://localhost:3000/wallet/transfer \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_number": "1234567890123",
    "amount": 1000
  }'

# 10. View transaction history
curl http://localhost:3000/wallet/transactions \
  -H "Authorization: Bearer YOUR_JWT"
```

### Running Unit Tests
```bash
npm run test
```

### Running E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

---

## 📁 Project Structure
```
wallet-service/
├── src/
│   ├── api-keys/              # API key management
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── api-keys.controller.ts
│   │   ├── api-keys.service.ts
│   │   └── api-keys.module.ts
│   │
│   ├── auth/                  # Authentication
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── wallet/                # Wallet operations
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── services/
│   │   │   └── paystack.service.ts
│   │   ├── wallet.controller.ts
│   │   ├── wallet.service.ts
│   │   └── wallet.module.ts
│   │
│   ├── transactions/          # Transaction management
│   │   ├── entities/
│   │   └── transactions.module.ts
│   │
│   ├── health/                # Health checks
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   │
│   ├── common/                # Shared resources
│   │   └── dto/
│   │
│   ├── config/                # Configuration
│   │   ├── database.config.ts
│   │   └── logger.config.ts
│   │
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
│
├── test/                      # Test files
├── logs/                      # Application logs
├── .env                       # Environment variables
├── .env.example               # Example environment file
├── .gitignore
├── docker-compose.yml         # Docker configuration
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
├── README.md
└── API_DOCUMENTATION.md       # Detailed API docs
```

---

## 🚀 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use production database
3. Set `synchronize: false` in database config
4. Use strong JWT secret (min 32 characters)
5. Use Paystack live keys
6. Configure production Google OAuth redirect URL

### Deploy to Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables via dashboard

# Deploy
railway up
```

### Deploy to Render

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: wallet-service
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: wallet-db
          property: connectionString

databases:
  - name: wallet-db
    databaseName: wallet_service
    user: wallet_user
```

2. Push to GitHub
3. Connect to Render
4. Add environment variables
5. Deploy

### Deploy to DigitalOcean

1. Push to GitHub
2. Create App on DigitalOcean App Platform
3. Configure build/run commands
4. Add PostgreSQL database
5. Set environment variables
6. Deploy

### Deploy with Docker
```bash
# Build image
docker build -t wallet-service .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  wallet-service
```

### Post-Deployment

1. Configure Paystack webhook URL:
```
   https://your-domain.com/wallet/paystack/webhook
```

2. Update Google OAuth redirect URL:
```
   https://your-domain.com/auth/google/callback
```

3. Test all endpoints in production

4. Monitor logs and errors

---

## 🔒 Security Considerations

### Implemented Security Measures

✅ **Authentication & Authorization**
- JWT tokens with expiration
- API key permission system
- Secure password hashing (if applicable)

✅ **Data Protection**
- HTTPS enforcement (in production)
- Environment variable encryption
- Sensitive data not logged

✅ **API Security**
- Request validation
- Rate limiting (recommended)
- CORS configuration
- SQL injection prevention (TypeORM)

✅ **Webhook Security**
- HMAC signature verification
- Idempotent processing
- Replay attack prevention

✅ **Transaction Security**
- Atomic database operations
- Balance verification
- Transfer limits
- Duplicate prevention

### Recommendations

1. **Enable Rate Limiting:**
```bash
   npm install @nestjs/throttler
```

2. **Add Helmet for HTTP Headers:**
```bash
   npm install helmet
```

3. **Implement Logging:**
   - Use Winston or Pino
   - Log all transactions
   - Monitor suspicious activity

4. **Regular Security Audits:**
```bash
   npm audit
   npm audit fix
```

5. **Database Backups:**
   - Daily automated backups
   - Test restore procedures

6. **Secrets Management:**
   - Use secret management service (AWS Secrets Manager, etc.)
   - Rotate API keys regularly

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error:** `Unable to connect to the database`

**Solutions:**
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database exists
- Check firewall/network settings
```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d wallet_service
```

#### 2. Google OAuth Error

**Error:** `redirect_uri_mismatch`

**Solutions:**
- Add redirect URI to Google Console
- Check `GOOGLE_CALLBACK_URL` in `.env`
- Ensure URL matches exactly (including http/https)

#### 3. Paystack Webhook Not Working

**Error:** Webhook not crediting wallet

**Solutions:**
- Check Paystack webhook URL configuration
- Verify `PAYSTACK_SECRET_KEY` is correct
- Test webhook signature verification
- Check server logs for errors
```bash
# Test webhook locally
node test-webhook.js DEP-reference 5000
```

#### 4. API Key Permission Denied

**Error:** `403 Forbidden`

**Solutions:**
- Check API key has required permission
- Verify API key is not expired
- Check API key is not revoked
- Ensure correct header: `x-api-key`

#### 5. Transfer Failed

**Error:** `Insufficient balance`

**Solutions:**
- Check wallet balance
- Complete deposit and wait for webhook
- Verify webhook processed successfully

### Debug Mode

Enable detailed logging:
```env
NODE_ENV=development
LOG_LEVEL=debug
```

View logs:
```bash
# Development
npm run start:dev

# Production
tail -f logs/combined.log
```

---

## 📊 Performance Optimization

### Database Optimization

1. **Add Indexes:**
```typescript
@Index(['userId'])
@Index(['walletNumber'])
@Index(['reference'])
```

2. **Connection Pooling:**
```typescript
extra: {
  max: 10,
  connectionTimeoutMillis: 5000,
}
```

### Caching (Optional)
```bash
npm install @nestjs/cache-manager cache-manager
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 http://localhost:3000/health
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Coding Standards

- Follow NestJS best practices
- Write unit tests for new features
- Update documentation
- Use meaningful commit messages
- Follow TypeScript strict mode

### Pull Request Process

1. Update README if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update API documentation
5. Request review from maintainers

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Emzy Jayyy** - *Initial work* - [YourGitHub](https://github.com/Emzy-Jayyy/wallet-service)

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Paystack](https://paystack.com/) - Payment infrastructure
- [TypeORM](https://typeorm.io/) - ORM for TypeScript
- [Swagger](https://swagger.io/) - API documentation

---

## 📞 Support

For issues, questions, or contributions:

- **GitHub Issues:** [Create an issue](https://github.com/Emzy-Jayyy/wallet-service/issues)
- **Documentation:** [API Docs](http://localhost:3000/api/docs)

---

## 🗺 Roadmap

### Upcoming Features

- [ ] Email notifications for transactions
- [ ] SMS notifications via Twilio
- [ ] Multiple currency support
- [ ] Wallet withdrawal to bank
- [ ] Transaction export (CSV/PDF)
- [ ] Admin dashboard
- [ ] Rate limiting
- [ ] Redis caching
- [ ] WebSocket real-time updates
- [ ] Mobile app support

---

## 📈 Changelog

### Version 1.0.0 (2024-12-10)

**Initial Release**

- ✅ Google OAuth authentication
- ✅ Wallet creation and management
- ✅ Paystack deposit integration
- ✅ Wallet-to-wallet transfers
- ✅ API key system
- ✅ Transaction history
- ✅ Swagger documentation
- ✅ Webhook handling
- ✅ Complete API documentation

---

## ⚠️ Important Notes

### Production Checklist

Before deploying to production:

- [ ] Change all default secrets
- [ ] Use production database
- [ ] Enable HTTPS/SSL
- [ ] Set `synchronize: false`
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test webhook with Paystack live mode
- [ ] Update Google OAuth redirect URLs
- [ ] Review security settings
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Test disaster recovery
- [ ] Document deployment process

### Maintenance

**Regular Tasks:**
- Monitor error logs daily
- Review transaction anomalies
- Backup database weekly
- Update dependencies monthly
- Security audit quarterly
- Review API key usage
- Check webhook delivery rates

---

## 🎓 Learning Resources

### NestJS
- [Official Documentation](https://docs.nestjs.com/)
- [NestJS Courses](https://courses.nestjs.com/)

### TypeORM
- [TypeORM Guide](https://typeorm.io/)
- [Database Relations](https://typeorm.io/relations)

### Paystack
- [API Reference](https://paystack.com/docs/api/)
- [Webhook Guide](https://paystack.com/docs/payments/webhooks/)

### OAuth 2.0
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Explained](https://oauth.net/2/)

---

**Built with ❤️ using NestJS**

**Status:** ✅ Production Ready

**Last Updated:** December 2024

---

*For detailed API documentation, visit the Swagger UI at `/api/docs` when the server is running.*