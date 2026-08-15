# Lopšeliai AI Coach

Create a production MVP for a Lithuanian kindergarten AI learning platform called "Lopšeliai".

## Pages to Build (5 pages total)
1. **LandingPage** - Hero section with value proposition and "Sukurti personalų kursą" CTA button
2. **OnboardingPage** - 7-step form collecting:
   - role (director, deputy_education, accountant_facility, teacher, specialist)
   - age_groups (nursery, preschool, prekindergarten) 
   - main_pain (parent_communications, education_plans, procurement_safety, reports_municipality, internal_orders)
   - ai_experience (beginner, intermediate, advanced)
   - output_format (ready_prompts, step-by-step_guides, document_templates)
   - time_budget (5_min, 15_min, 30_min)
   - language_style (lt, ru)
3. **AuthCallbackPage** - Auto-restore onboarding after Magic Link and start generation
4. **LoadingPage** - Display course generation status with animations
5. **DashboardPage** - Show AI course with modules, lessons, prompts, and progress tracking

## Custom Hooks Needed (add to src/hooks/)
1. useOnboardingRestore - Restore quiz data after Magic Link, 30s timeout, Zod validation
2. useGenerationStatus - Track course generation status via Realtime + polling

## Components Needed (add to src/components/)
1. FailedGenerationScreen - Error UI with retry button (Lithuanian copy)

## Storage Utility (add to src/lib/)
1. storage.ts - Safe sessionStorage with Safari Private Mode + QuotaExceededError fallback

## Configuration
- All UI text in Lithuanian
- Support Lithuanian (lt) and Russian (ru) for generated content
- Mobile-first responsive design
- Integration with Supabase for auth, database, RLS
- Mock generation initially (2-5 sec delay), real Anthropic API later

## Styling
Use Tailwind CSS + shadcn/ui for consistent, professional look

Start building the structure and pages. I'll add the custom hooks and utilities via code after initial setup.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lopseliai-ai-helper.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d7213964-12c9-4b6d-b45a-e5c5cec4f77e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
