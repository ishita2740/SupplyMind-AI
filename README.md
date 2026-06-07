# SupplyMind AI - Supply Chain Intelligence Platform

AI-powered supply chain optimization platform built with Next.js 16, React 19, and TypeScript.

## Features

### Core Modules
- **Executive Dashboard** - Real-time KPIs, revenue tracking, forecast accuracy, and alerts
- **Demand Forecasting** - XGBoost, Prophet, and ARIMA forecasts with confidence scores
- **Inventory Intelligence** - Stock health monitoring, reorder suggestions, and category analytics
- **Business Simulation Engine** - Interactive discount and festival impact modeling with revenue projections
- **AI Assistant** - OpenAI-powered chatbot for supply chain insights and recommendations
- **Analytics** - Product, category, and seasonal analytics with detailed reporting
- **Settings** - User profile management, API key generation, and preferences

### Architecture
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Better Auth (email/password auth), Drizzle ORM
- **Database**: Neon PostgreSQL (17+ tables)
- **AI**: Vercel AI SDK 6 with OpenAI GPT-5-mini
- **Styling**: Professional light theme (blue primary #0066cc, no dark mode)

## Quick Start

### Prerequisites
- Node.js 18+ or bun
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Add your environment variables in .env.local:
# BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
# DATABASE_URL=<your Neon PostgreSQL connection string>
# AI_GATEWAY_API_KEY=<your Vercel AI Gateway key>
```

### Development

```bash
# Start dev server (runs on localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BETTER_AUTH_SECRET` | Secret for session encryption (generate with `openssl rand -base64 32`) | ✓ |
| `DATABASE_URL` | Neon PostgreSQL connection string | ✓ |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API key for OpenAI access | ✓ |

## Database

The application uses Neon PostgreSQL with the following tables:

**Auth Tables:**
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth accounts
- `verification` - Email verification tokens

**Application Tables:**
- `organization` - Company/organization data
- `supplier` - Supplier information with reliability/cost/quality scores
- `inventory_item` - Product inventory with SKU, stock levels, reorder points
- `stock_history` - Inventory transaction history
- `order` - Purchase and sales orders
- `demand_forecast` - Demand predictions with confidence scores
- `revenue_record` - Revenue data by category
- `quality_metric` - Supplier and product quality metrics
- `risk_factor` - Supply chain risk tracking
- `compliance_record` - Regulatory compliance status
- `simulation_scenario` - Business simulation scenarios
- `analytics_event` - Event tracking for analytics
- `ai_conversation` - AI assistant chat history
- `user_settings` - User preferences and API keys

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Other Platforms

1. Build the project: `pnpm build`
2. Set environment variables
3. Point to the `.next` output directory
4. Set Node.js version to 18+

## Project Structure

```
/app
  /(auth)              # Authentication pages
  /(dashboard)         # Main app routes
  /api                 # API routes
/components
  /ui                  # shadcn/ui components
  *.tsx                # Page components
/lib
  auth.ts              # Better Auth configuration
  auth-client.ts       # Better Auth client
  /db                  # Database setup
    index.ts           # Drizzle client
    schema.ts          # Database schema
/public                # Static assets
```

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linter
```

## Authentication

The application uses Better Auth with email + password authentication:

- **Sign Up**: Create a new account at `/sign-up`
- **Sign In**: Log in at `/sign-in`
- **Session**: Secured with httpOnly cookies
- **Protected Routes**: All dashboard routes require authentication

## Dashboard Features

### Executive Dashboard
- Revenue tracking and trends
- Forecast accuracy metrics (XGBoost, Prophet, ARIMA)
- Inventory health indicators
- Real-time alerts and notifications

### Demand Forecasting
- 30-day demand predictions
- Confidence scores and intervals
- Algorithm comparison (XGBoost vs Prophet vs ARIMA)
- Historical vs predicted data visualization

### Inventory Management
- Real-time stock levels
- Low stock alerts
- Reorder point suggestions
- Category-based analytics
- Inventory value tracking

### Business Simulation
- Interactive discount modeling (0-50%)
- Festival impact simulation (0-100%)
- Revenue and margin projections
- Sensitivity analysis

### AI Assistant
- Real-time chat with supply chain AI
- Business recommendations
- Forecast explanations
- Anomaly detection insights

### Analytics
- Product performance analysis
- Category-based breakdown
- Seasonal trend analysis
- Custom report generation

### Settings
- User profile management
- API key generation and management
- Notification preferences
- Currency and theme selection

## Mock Data

The application includes realistic mock data generators for:
- 12+ months of historical data
- 1,250+ inventory items across categories
- Supplier performance metrics
- Order and shipment history
- Quality and risk metrics
- Forecast data with confidence scores

## Performance

- **Dev Build**: ~14 seconds
- **Production Build**: ~277ms static generation
- **Bundle Size**: Optimized with Turbopack
- **API Routes**: Streaming responses support

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `pnpm install`
- Verify environment variables are set

### Database Errors
- Check `DATABASE_URL` connection string
- Ensure Neon database is running
- Verify all required tables exist

### Auth Errors
- Set `BETTER_AUTH_SECRET` with at least 32 characters
- Clear cookies: `agent-browser cookies`
- Check browser console for detailed errors

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review environment variable setup
3. Check Vercel/Neon dashboard for service status
4. Review build logs for specific errors

## License

MIT

## Next Steps

After deployment:

1. **Connect Neon Database**: Update `DATABASE_URL` with your production database
2. **Configure AI Gateway**: Add your `AI_GATEWAY_API_KEY`
3. **Set Auth Secret**: Generate and add `BETTER_AUTH_SECRET`
4. **Create Admin User**: Sign up through the app
5. **Load Sample Data**: Use the seeded mock data generators
6. **Configure Alerts**: Set up notification preferences
7. **Add Suppliers**: Manually or import supplier data
8. **Import Inventory**: Add your actual inventory items
9. **Connect APIs**: Integrate with your systems
10. **Monitor Performance**: Use analytics dashboard

## Additional Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Better Auth Documentation](https://www.better-auth.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [Neon Documentation](https://neon.tech/docs)
