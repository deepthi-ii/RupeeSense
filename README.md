# RupeeSense – Smart Personal Finance & Shared Expense Management

<p align="center">
  <strong>RupeeSense</strong><br/>
  <em>Understand Your Money. Manage Your Spending. Split Without Stress.</em>
</p>

---

## 1. About the Project

**RupeeSense** is a smart personal finance and shared expense management web application designed to help students and individuals manage their money more effectively.

Managing personal finances can be challenging, especially for students who depend on monthly allowances, scholarships, part-time jobs or limited income. Small daily expenses often go unnoticed, and people sharing accommodation or travelling with friends frequently face difficulties calculating and settling shared expenses.

RupeeSense addresses these problems through a unified financial management platform.

The application allows users to record their income and expenses, monitor their available balance, manage savings goals, create shared expense rooms with friends, track group spending and calculate individual contributions.

Unlike traditional expense trackers that focus mainly on recording transactions, RupeeSense combines **personal financial management and collaborative expense tracking** in one platform.

Its goal is to make money management simpler, more transparent and more convenient.

## 2. Project Objectives

The primary objectives of RupeeSense are:

- To develop a user-friendly personal finance management platform.
- To maintain digital records of income and expenses.
- To help users monitor their available balance and spending habits.
- To encourage budgeting and regular saving habits.
- To simplify expense sharing among friends, roommates and travel groups.
- To automatically calculate individual contributions towards shared expenses.
- To provide transparency in group financial activities.
- To reduce confusion and disagreements related to shared payments.
- To provide a centralized platform for personal and group financial management.

## 3. Key Features

### Module 1 – Personal Finance Management

This module focuses on helping users manage their individual finances.

**1. Personal Transactions**

- Add income and expense transactions.
- Enter transaction amounts and descriptions.
- Categorize transactions.
- Select transaction types.
- Maintain a personal transaction history.
- View and manage recorded transactions.

**2. Expense Tracking**

- Monitor daily and monthly expenses.
- Categorize spending activities.
- Track where money is being spent.
- Compare income and expenditure.
- Understand personal spending patterns.

**3. Financial Dashboard**

- View total income.
- View total expenses.
- Monitor available balance.
- Get a quick overview of financial activities.
- Access recent transactions.

**4. Savings Goals**

- Create individual savings goals.
- Set a target amount.
- Record savings progress.
- Track progress towards financial targets.
- Manage multiple savings goals.

Examples:
- Buying a laptop.
- Purchasing headphones.
- Planning a vacation.
- Building an emergency fund.
- Saving monthly pocket money.

### Module 2 – Shared Expense Management

This module is designed for friends, roommates, students and travel groups who share expenses.

**1. Create a Shared Room**

- Create a room for a group.
- Give the room a suitable name.
- Generate or share an invitation link.
- Invite friends to join the room.
- Manage shared group activities.

Examples:
- College Friends Trip.
- Hostel Room 204.
- Apartment Expenses.
- Weekend Outing.
- Monthly Grocery Expenses.

**2. Group Expense Tracking**

- Add expenses to a shared room.
- Enter the expense title and amount.
- Record who paid for the expense.
- Maintain a shared expense history.
- Keep group spending organized.

**3. Automatic Expense Splitting**

- Calculate individual shares of group expenses.
- Distribute expenses among participating members.
- Track how much each member owes.
- Identify who has paid and who still needs to pay.
- Reduce manual calculations and confusion.

**4. Payment Deadline Management**

- Set a payment deadline for shared expenses.
- Define how many days members have to settle their dues.
- Monitor pending payments.
- Review settlement status.
- Keep track of outstanding contributions.

**5. Final Group Settlement**

At the end of a trip, billing period or shared activity, users can review the final expense summary.

The settlement summary helps members understand:

- Total group expenditure.
- Individual contributions.
- Individual share of expenses.
- Amount owed by each member.
- Pending settlements.
- Overall payment status.

Members can use their preferred external payment applications, such as Google Pay, PhonePe or other UPI applications, to settle their dues. Actual payment processing depends on the available payment functionality.

## 4. How RupeeSense Works

The application follows a simple workflow.

### Personal Finance Workflow

1. A user creates an account and logs in.
2. The user accesses the personal dashboard.
3. Income and expenses are recorded.
4. Transactions are categorized and stored.
5. The dashboard reflects financial activity.
6. The user creates savings goals and monitors progress.

### Shared Expense Workflow

1. A user creates an account.
2. The user creates a shared expense room.
3. An invitation link is shared with friends.
4. Friends join the room.
5. Members add their shared expenses.
6. The application records expenses and contributors.
7. Individual expense shares are calculated.
8. Members monitor their pending contributions.
9. At the end of the selected period, the group reviews its final settlement.
10. Members settle their dues using their preferred payment applications.

## 5. Technology Stack

RupeeSense is developed using modern web technologies.

| Technology | Purpose |
|---|---|
| React.js | Building the interactive user interface |
| JavaScript | Application logic and functionality |
| CSS | Styling, layouts and responsive design |
| Vite | Frontend development and build tool |
| Supabase | Backend services and database management |
| PostgreSQL | Storing user and financial information |
| GitHub | Source code management and version control |
| Vercel | Hosting and deployment |

### Backend and Database

Supabase is used to manage the application's backend infrastructure.

It provides:
- Database storage.
- User authentication.
- Data access through the Supabase client.
- Row Level Security (RLS) for controlling access to financial records.

### Frontend

React.js is used to create reusable components and interactive application pages.

JavaScript handles application functionality, calculations and user interactions, while CSS provides the visual design.

## 6. Design Philosophy

RupeeSense follows a distinctive **Y2K-inspired Old Money aesthetic**.

Instead of using a conventional finance application appearance, the interface focuses on an elegant and sophisticated visual identity.

### Design Elements

- Ivory and cream backgrounds.
- Forest green accents.
- Champagne gold details.
- Elegant serif typography.
- Minimal and organized layouts.
- Refined financial dashboard elements.
- Sophisticated cards and visual hierarchy.

The design aims to make financial management feel simple, premium and enjoyable.

## 7. Database Management

Supabase PostgreSQL is used to store and manage application data.

The main database entities include:

| Table | Purpose |
|---|---|
| `personal_transactions` | Stores individual income and expense records |
| `rooms` | Stores shared expense room information |
| `group_expenses` | Stores expenses recorded within shared rooms |
| `savings_goals` | Stores individual savings targets and progress |

The application uses database access policies to control how users interact with their financial information.

## 8. Installation and Setup

Follow these instructions to run RupeeSense locally.

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- A Supabase account

### Step 1: Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### Step 2: Navigate to the Project

```bash
cd RupeeSense
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a `.env.local` file in the root directory.

Add the following variables:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL

VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Replace the placeholder values with the credentials from your Supabase project.

Never expose your Supabase service-role key in frontend code.

### Step 5: Configure Supabase Database

- Create a Supabase project.
- Open the SQL Editor.
- Execute the project's database schema.
- Configure the required Row Level Security policies.
- Verify that the application tables are available.

### Step 6: Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## 9. Deployment

RupeeSense is deployed using Vercel and connected to its GitHub repository.

### Deployment Process

1. Push the project source code to GitHub.
2. Log in to Vercel.
3. Import the GitHub repository.
4. Configure the project as a Vite application.
5. Add the required environment variables.
6. Select the production environment.
7. Deploy the application.
8. Verify the deployed website.

The application uses Supabase as its backend, so the production environment variables must point to the correct Supabase project.

## 10. Security and Privacy

Since RupeeSense handles personal financial information, data protection is an important consideration.

The application uses:

- Supabase authentication for account access.
- PostgreSQL database storage.
- Row Level Security policies.
- Controlled database access.
- Environment variables for project configuration.

Users should only be able to access financial information permitted by the application's database policies.

## 11. Future Enhancements

RupeeSense has scope for several additional features.

**1. Financial Future Prediction**

Use historical spending patterns to estimate the user's end-of-month balance and identify possible cash shortages.

**2. Smart Spending Alerts**

Notify users when they approach their monthly budget or spend unusually high amounts.

**3. Advanced Spending Analytics**

Introduce interactive charts and category-wise spending comparisons.

**4. Automated Payment Integration**

Explore secure UPI payment links and payment gateway integrations for easier settlements.

**5. Bill Reminders**

Allow users to record upcoming bills and receive payment reminders.

**6. Smart Expense Recommendations**

Provide personalized suggestions to improve budgeting and savings habits.

**7. Gamified Savings Challenges**

Introduce financial challenges and rewards to encourage consistent saving.

**8. Mobile Application**

Extend RupeeSense into a mobile application for convenient financial tracking.

## 12. Project Outcomes

RupeeSense aims to provide a unified solution for two common financial challenges:

- Managing personal income, expenses and savings.
- Managing shared expenses among friends and roommates.

By combining these functionalities, the platform helps users maintain better financial records, understand their spending habits and simplify group settlements.

It transforms expense tracking from a simple record-keeping activity into a more organized financial management experience.

## 13. Conclusion

RupeeSense is more than just an expense tracker. It is a personal and collaborative financial management platform designed around the everyday financial needs of students and individuals.

By combining personal transaction management, expense tracking, savings goals and shared expense management, RupeeSense makes handling money more organized and transparent.

**RupeeSense – The Art of Managing Money.**

---

## Project Information

**Project Name:** RupeeSense

**Project Category:** Personal Finance Management

**Project Type:** Web Application

**Frontend:** React.js, JavaScript, CSS

**Backend:** Supabase

**Database:** PostgreSQL

**Development Tool:** Vite

**Version Control:** GitHub

**Deployment:** Vercel
