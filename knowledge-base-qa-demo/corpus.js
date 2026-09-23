// Fixed, fictional document corpus for the knowledge-base Q&A demo.
// "Northbound Scheduler" is an invented appointment-scheduling SaaS product —
// not a real company. Content is deliberately specific (real-sounding numbers,
// steps, and policy terms) so retrieval has something substantive to surface;
// a thin corpus makes every answer read as trivial.

export const CORPUS = [
  {
    docId: "faq",
    docTitle: "Frequently Asked Questions",
    sections: [
      {
        sectionTitle: "Free trial",
        text: "Northbound Scheduler offers a 14 day free trial on every plan, no credit card required to start. During the trial you have full access to all features on the Growth plan, including online booking pages, automated reminders, and payment collection. If you don't add a payment method before the trial ends, your account automatically converts to the free Starter plan (1 staff member, up to 50 bookings per month) rather than being deleted, so you never lose your data.",
      },
      {
        sectionTitle: "Plans and billing cycle",
        text: "Northbound Scheduler bills monthly or annually. Annual plans are billed once per year and cost the equivalent of 10 months, a 2 month discount versus paying monthly. Monthly plans are billed on the same calendar day each month as your original signup date. All plans include unlimited clients and unlimited appointment history. Invoices are emailed automatically and are also available anytime under Settings > Billing > Invoices.",
      },
      {
        sectionTitle: "Changing or cancelling a plan",
        text: "You can upgrade, downgrade, or cancel your plan at any time from Settings > Billing > Plan. Upgrades take effect immediately and are prorated for the remainder of the current billing cycle. Downgrades take effect at the start of your next billing cycle, so you keep access to your current plan's features until then. See the Refund & Cancellation Policy document for what happens to unused time when you cancel outright.",
      },
      {
        sectionTitle: "Data export and deletion",
        text: "You can export all of your client records, appointment history, and invoices as a CSV file at any time from Settings > Data > Export. If you close your account, Northbound Scheduler retains your data for 30 days in case you want to reactivate, then permanently deletes it. You can request immediate deletion instead of the 30 day hold by emailing privacy@northboundscheduler.example.",
      },
      {
        sectionTitle: "Support hours and channels",
        text: "Live chat support is available Monday through Friday, 8am to 8pm Eastern, for customers on the Growth plan and above. Email support at support@northboundscheduler.example is available to every plan, including Starter, with a target first response time of one business day. Enterprise plan customers get a dedicated account manager and a shared Slack channel for direct support.",
      },
      {
        sectionTitle: "Integrations",
        text: "Northbound Scheduler connects with Google Calendar and Outlook/Microsoft 365 for two-way calendar sync, Stripe for payment processing, Mailchimp for marketing email sync, and Zapier for connecting to over 3,000 other apps. QuickBooks Online sync is available on the Growth plan and above.",
      },
    ],
  },
  {
    docId: "refund-policy",
    docTitle: "Refund & Cancellation Policy",
    sections: [
      {
        sectionTitle: "Monthly plan cancellations",
        text: "You can cancel a monthly plan at any time from Settings > Billing > Plan. Your account stays active through the end of the billing period you already paid for, and you will not be charged again after that. Northbound Scheduler does not prorate or refund the unused portion of a monthly billing period you're already in — cancelling on day 3 of a 30 day cycle does not entitle you to a partial refund for the remaining 27 days.",
      },
      {
        sectionTitle: "Refund window for new subscriptions",
        text: "If you upgrade from the free trial to a paid plan and decide it isn't right for you, you have 14 calendar days from the date of your first payment to request a full refund, no questions asked. This applies to both monthly and annual plans. After the 14 day window closes, standard cancellation terms apply and no refund is issued for the current billing period.",
      },
      {
        sectionTitle: "Annual plan cancellations",
        text: "Annual plans can be cancelled at any time from Settings > Billing > Plan. If you cancel within the first 30 days of an annual billing cycle, Northbound Scheduler refunds the unused months on a prorated basis, calculated from the day support processes your cancellation request. After day 30 of the annual cycle, annual plans are non-refundable for the remainder of that year, though you will not be charged again at renewal.",
      },
      {
        sectionTitle: "Non-refundable items",
        text: "Three charges are never refundable under any circumstances: one-time setup and data-migration fees, SMS text message credit packs once purchased, and custom integration work billed separately from your subscription. Each of these is labeled non-refundable at the time of purchase.",
      },
      {
        sectionTitle: "How to request a refund",
        text: "To request a refund within an eligible window, email billing@northboundscheduler.example from the address on your account with your business name and the reason for cancelling. Refund requests are processed within 5 business days and returned to the original payment method. Refunds are never issued as account credit unless you specifically ask for that instead.",
      },
    ],
  },
  {
    docId: "onboarding-guide",
    docTitle: "Getting Started Guide",
    sections: [
      {
        sectionTitle: "Step 1: Create your business profile",
        text: "After signing up, you'll be asked for your business name, industry (choose from Salon & Spa, Home & Field Services, Health & Wellness, Fitness, or Other), time zone, and business hours. Business hours set the default availability window that new staff members inherit, though each staff member can override it individually later.",
      },
      {
        sectionTitle: "Step 2: Add your services",
        text: "Go to Setup > Services to add what you offer. Each service needs a name, a duration in 5 minute increments (minimum 5 minutes, maximum 8 hours), and a price. You can group services into categories, for example 'Haircuts' and 'Color', which controls how they're organized on your public booking page. A service can also require a buffer time before or after the appointment, useful for cleanup or setup.",
      },
      {
        sectionTitle: "Step 3: Add staff and set availability",
        text: "Under Setup > Staff, add each team member who takes appointments, with their name, role, and which services they're qualified to perform. Every staff member gets their own login. Availability is set per staff member per day of the week, and you can add one-off exceptions for holidays, vacations, or a single day's schedule change without touching the recurring weekly pattern.",
      },
      {
        sectionTitle: "Step 4: Connect your calendar",
        text: "Go to Settings > Integrations > Calendar and connect either Google Calendar or Outlook. This is a two-way sync: appointments booked in Northbound Scheduler appear on your connected calendar, and events you add directly to your calendar block that time from being booked by clients. Sync typically completes within 60 seconds of a change on either side.",
      },
      {
        sectionTitle: "Step 5: Set up your online booking page",
        text: "Every account gets a free booking page at yourbusiness.northboundscheduler.example, customizable under Setup > Booking Page with your logo, colors, and a short business description. Clients pick a service, a staff member (or 'any available'), and a time slot, with no account creation required on their end. You can also embed the booking widget directly into an existing website with a single line of JavaScript, found under Setup > Booking Page > Embed Code.",
      },
      {
        sectionTitle: "Step 6: Configure reminders",
        text: "Under Setup > Notifications, turn on automated reminders sent by email (included on every plan) and SMS text message (Growth plan and above). The default reminder schedule sends one reminder 24 hours before the appointment and a second reminder 2 hours before, both editable, and you can add a third custom reminder at any interval you choose.",
      },
      {
        sectionTitle: "Step 7: Invite your team",
        text: "From Setup > Staff > Invite, send each team member an email invitation to set their own password and log in. Staff members can only see and manage their own appointments unless you grant them the Manager role under Setup > Staff > Permissions, which gives visibility into the whole team's schedule and access to reporting.",
      },
    ],
  },
  {
    docId: "product-spec",
    docTitle: "Product Overview & Features",
    sections: [
      {
        sectionTitle: "Core scheduling engine",
        text: "Northbound Scheduler's calendar supports individual staff calendars, a combined team view, and a resource view for businesses that book equipment or rooms rather than people, for example a massage room or a piece of equipment. Double-booking is prevented automatically, and the system accounts for service buffer times, staff availability windows, and any connected external calendar's existing events.",
      },
      {
        sectionTitle: "Client booking page",
        text: "The public-facing booking page requires no login for clients and works on any device. It supports real-time availability, service and staff selection, and optional intake questions you configure per service, for example asking a client to describe their issue before a plumbing appointment. Confirmation and reminder emails go out automatically once a booking is made.",
      },
      {
        sectionTitle: "Automated reminders and notifications",
        text: "Reminders reduce no-shows and go out by email on every plan, and by SMS text message on the Growth plan and above. Clients can confirm, reschedule, or cancel directly from the reminder link without calling in, and every reschedule or cancellation instantly frees the slot back up for other clients to book.",
      },
      {
        sectionTitle: "Payments and deposits",
        text: "Northbound Scheduler integrates with Stripe to collect full payment or a deposit at the time of booking. You can require a deposit, either a flat amount or a percentage of the service price, for specific services, useful for reducing no-shows on higher-value appointments. Payment processing fees are Stripe's standard rate (2.9% plus 30 cents per transaction in the US) and are not marked up by Northbound Scheduler.",
      },
      {
        sectionTitle: "Reporting and analytics",
        text: "The Reports dashboard, available on the Growth plan and above, shows booking volume over time, revenue by service and by staff member, no-show and cancellation rates, and new versus returning client counts. Reports can be filtered by date range and exported as a CSV, or scheduled as a recurring email sent weekly or monthly to whoever you choose.",
      },
      {
        sectionTitle: "Plans and pricing",
        text: "Starter is free forever: 1 staff member, up to 50 bookings per month, email reminders only. Solo is $19 per month, or $190 per year: 1 staff member, unlimited bookings, email and SMS reminders. Growth is $49 per month per additional staff member, or $490 per year per staff member, and includes the full feature set: unlimited staff, SMS reminders, payments and deposits, reporting, and QuickBooks sync. Enterprise is custom-priced and adds a dedicated account manager, a custom contract, and single sign-on.",
      },
      {
        sectionTitle: "Integrations and API",
        text: "Beyond the built-in Google Calendar, Outlook, Stripe, Mailchimp, and QuickBooks integrations, Northbound Scheduler offers a Zapier connection for linking to thousands of other apps without code, and a REST API, documented at developers.northboundscheduler.example, for businesses that want to build a fully custom integration. The API is available on the Growth plan and above.",
      },
    ],
  },
];
