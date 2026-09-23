-- Seed data. Everything here is invented.
--
-- Dates are relative to the day you run `npm run db:reset`, so yesterday
-- always has replies waiting to be reviewed.
--
-- Cast
--   Marta Ruiz    lead        Voltra, Boxwell
--   Nuria Campos  lead        Oddbird
--   Dani Ortega   specialist  Voltra, Oddbird   (spans both leads)
--   Sofía Méndez  specialist  Voltra, Boxwell
--   Leo Varela    specialist  Boxwell, Oddbird  (spans both leads)
--
-- Stories in the history, so the trends have something to show
--   * Sofía used to offer Voltra returns before diagnosing. It fades over
--     the nine weeks, and Voltra's average climbs with it.
--   * Leo stopped checking Boxwell order history for about a month, four
--     to seven weeks ago, and told customers split shipments had arrived.
--   * Dani writes Oddbird replies in Voltra's voice.
--
-- Every demo account has the password second-read-demo.

-- Helpers for deterministic "randomness": the same seed every reset.
create function pg_temp.rnd(p_key text) returns double precision
language sql immutable as $$
  select (('x' || lpad(left(md5(p_key), 8), 16, '0'))::bit(64)::bigint % 1000000) / 1000000.0
$$;

-- Same formula as replies.sample_bucket.
create function pg_temp.bucket(p_id uuid) returns int
language sql immutable as $$
  select (('x' || lpad(left(md5(p_id::text), 8), 16, '0'))::bit(64)::bigint % 10000)::int
$$;

-- People and accounts ---------------------------------------------------------

create temp table seed_people (key text primary key, person_id uuid, auth_id uuid, full_name text, email text);

insert into seed_people values
  ('marta', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'Marta Ruiz',   'marta@second-read.test'),
  ('nuria', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Nuria Campos', 'nuria@second-read.test'),
  ('dani',  '10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', 'Dani Ortega',  'dani@second-read.test'),
  ('sofia', '10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004', 'Sofía Méndez', 'sofia@second-read.test'),
  ('leo',   '10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000005', 'Leo Varela',   'leo@second-read.test');

-- GoTrue scans the token columns into strings, so they must be '' rather than null.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', auth_id, 'authenticated', 'authenticated', email,
  extensions.crypt('second-read-demo', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', jsonb_build_object('full_name', full_name), now(), now(),
  '', '', '', ''
from seed_people;

insert into auth.identities (user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select auth_id, auth_id::text, 'email',
       jsonb_build_object('sub', auth_id::text, 'email', email, 'email_verified', true),
       now(), now(), now()
from seed_people;

insert into public.people (id, auth_user_id, full_name, email)
select person_id, auth_id, full_name, email from seed_people;

-- Brands -----------------------------------------------------------------------

insert into public.brands (id, slug, name, voice, procedures, sample_rate) values
(
  '20000000-0000-4000-8000-000000000001', 'voltra', 'Voltra',
  $t$Warm, plain and patient. First names, short sentences, one question at a time. Never suggest the rider did something wrong. Sign off: "Ride safe, <name> at Voltra".$t$,
  $t$1. Open the order history before replying: model, purchase date, warranty status, earlier tickets.
2. Diagnose before offering a return. Ask for the error code on the display and walk them through the reset (hold the power button for 10 seconds). Half the "broken" scooters are fine.
3. Offer a return only when diagnosis fails, or when the scooter arrived dead within 14 days.
4. Never quote repair turnaround times. The repair partner confirms dates.
5. Warranty: 2 years on frame and motor, 1 year on the battery. Only the Voltra charger (42V 2A).$t$,
  0.250
),
(
  '20000000-0000-4000-8000-000000000002', 'boxwell', 'Boxwell',
  $t$Fast and exact. Lead with the order number, then the facts: SKU, quantity, date. Three lines, no small talk, no exclamation marks. Sign off: "— Boxwell Support".$t$,
  $t$1. First line: the order number and the exact item (SKU, quantity, date).
2. Check the order history before answering anything about delivery. Split shipments and back-orders are common.
3. Missing or damaged units: reship the shortfall the same day if the claim arrives before 14:00, otherwise the next morning. No photos needed under 10 units.
4. Never promise a delivery date the carrier has not confirmed.
5. Three lines is the target. Our customers are warehouse managers between two trucks.$t$,
  0.200
),
(
  '20000000-0000-4000-8000-000000000003', 'oddbird', 'Oddbird Coffee',
  $t$Friendly and a little playful. First names, short paragraphs, one emoji at most. Do things for people instead of telling them how. Sign off: "Brewing for you, <name> & the Oddbird crew".$t$,
  $t$1. Make the change for the customer: skip, pause, swap, grind. Never send instructions for something we can do in ten seconds.
2. Stale or damaged bag: send a replacement free, no return needed. Ask for the batch number printed under the roast date.
3. Refunds only for unopened bags within 30 days. Opened bags get a replacement or credit.
4. Before any billing answer, check the subscription page. The plan and the next charge date are there.$t$,
  0.250
);

create temp table seed_brands (slug text primary key, brand_id uuid, lead text, specialists text[], per_day int, order_prefix text, ticket_prefix text);

insert into seed_brands values
  ('voltra',  '20000000-0000-4000-8000-000000000001', 'marta', array['sofia', 'dani'], 14, 'VT-', 'VOL-'),
  ('boxwell', '20000000-0000-4000-8000-000000000002', 'marta', array['sofia', 'leo'],  14, 'BX-', 'BW-'),
  ('oddbird', '20000000-0000-4000-8000-000000000003', 'nuria', array['dani', 'leo'],   10, 'OB-', 'ODD-');

insert into public.brand_memberships (brand_id, person_id, role)
select b.brand_id, p.person_id, 'lead'
from seed_brands b join seed_people p on p.key = b.lead
union all
select b.brand_id, p.person_id, 'specialist'
from seed_brands b cross join unnest(b.specialists) as s(key) join seed_people p on p.key = s.key;

-- Criteria ---------------------------------------------------------------------
-- Ids are derived from the key so templates below can refer to them.

insert into public.criteria (id, brand_id, category, label, guidance, severity, position)
select md5('criterion:' || c.key)::uuid, b.brand_id, c.category, c.label, c.guidance, c.severity, c.position
from (values
  ('voltra.accuracy',      'voltra',  'accuracy',   'Product and warranty facts are right',        'Range, charging, warranty terms, error codes. A wrong fact is how we lose the account.', 'critical', 1),
  ('voltra.order-history', 'voltra',  'procedure',  'Checked the order history first',             'Model, purchase date, warranty status and earlier tickets show up in the reply.',         'critical', 2),
  ('voltra.diagnose',      'voltra',  'procedure',  'Diagnosed before offering a return',          'Error code, reset, one question at a time. The return is the last step, not the first.', 'major',    3),
  ('voltra.relevance',     'voltra',  'relevance',  'Answered the question that was asked',        '',                                                                                         'major',    4),
  ('voltra.resolution',    'voltra',  'resolution', 'The customer knows exactly what happens next', 'Would this reply stop them writing in again?',                                            'major',    5),
  ('voltra.tone',          'voltra',  'tone',       'Sounds like Voltra',                          'Warm, plain words, patient. Never implies the rider did it wrong.',                        'minor',    6),
  ('voltra.speed',         'voltra',  'speed',      'Replied within 4 hours',                      '',                                                                                         'minor',    7),
  ('boxwell.accuracy',      'boxwell', 'accuracy',   'Quantities, SKUs and dates are exact',   'Read the order line twice before sending a number.',            'critical', 1),
  ('boxwell.order-history', 'boxwell', 'procedure',  'Checked the order history first',        'Split shipments, back-orders and earlier claims.',              'critical', 2),
  ('boxwell.carrier',       'boxwell', 'procedure',  'Only carrier-confirmed dates',           'Say what is confirmed. Offer express instead of guessing.',     'major',    3),
  ('boxwell.relevance',     'boxwell', 'relevance',  'Answered the question that was asked',   '',                                                              'major',    4),
  ('boxwell.resolution',    'boxwell', 'resolution', 'A concrete next step with a date',       '',                                                              'major',    5),
  ('boxwell.tone',          'boxwell', 'tone',       'Three lines, no filler',                 'Order number first. No greetings, no exclamation marks.',       'minor',    6),
  ('boxwell.speed',         'boxwell', 'speed',      'Replied within 2 hours',                 'A driver waiting at a dock cannot wait until tomorrow.',        'major',    7),
  ('oddbird.accuracy',   'oddbird', 'accuracy',   'Subscription and billing facts are right', 'Check the subscription page before any billing answer.',      'critical', 1),
  ('oddbird.do-it',      'oddbird', 'procedure',  'Made the change instead of explaining how', 'Skip, pause, swap, grind: we do it, they do not get homework.', 'major',    2),
  ('oddbird.relevance',  'oddbird', 'relevance',  'Answered what was asked',                   '',                                                             'major',    3),
  ('oddbird.resolution', 'oddbird', 'resolution', 'Nothing left for the customer to do',       '',                                                             'major',    4),
  ('oddbird.tone',       'oddbird', 'tone',       'Sounds like Oddbird',                       'Warm, a little playful, short paragraphs. Never "Dear customer".', 'minor', 5),
  ('oddbird.speed',      'oddbird', 'speed',      'Replied the same day',                      '',                                                             'minor',    6)
) as c(key, brand, category, label, guidance, severity, position)
join seed_brands b on b.slug = c.brand;

-- Reply templates --------------------------------------------------------------
-- Placeholders: {first} customer first name, {order} order number,
-- {agent} specialist first name, {date} a date five weeks after sending.

create temp table seed_templates (
  key text primary key,
  brand text not null,
  quality text not null,         -- good | ok | bad: drives how often it shows up in history
  score smallint not null,       -- what the lead gives it
  flags text[] not null,         -- criteria it misses
  delay_minutes int,             -- time to reply; null means 20 to 180 minutes
  subject text not null,
  customer_message text not null,
  body text not null,
  note text not null             -- what the lead wrote on it
);

insert into seed_templates values
(
  'voltra-e10', 'voltra', 'good', 5, '{}', null,
  'Display shows E10 and it won''t move',
  $t$Hi, my S2 turned on this morning but the display shows E10 and the motor won't engage at all. I use it to get to work so I need this sorted fast. Can I just send it back?$t$,
  $t$Hi {first},

Sorry about the morning commute. E10 is almost always the brake sensor telling the scooter a brake is still pulled, so the motor stays off to keep you safe. Nothing is broken yet, and a quick check fixes it most of the time:

1. Switch the scooter off.
2. Squeeze and release both brake levers firmly a couple of times.
3. Hold the power button for 10 seconds to reset it, then switch it on.

If E10 is still there, send me a photo of the display and of the left brake lever from underneath and I'll take it from there. I checked your order and your S2 is well inside its warranty, so whatever it turns out to be, you're covered.

Ride safe,
{agent} at Voltra$t$,
  $t$This is the one I'd show a new joiner: diagnosis first, the warranty checked in the order history, and the return isn't even on the table yet.$t$
),
(
  'voltra-range', 'voltra', 'good', 4, '{}', null,
  'How far does the S2 Max really go?',
  $t$Thinking of upgrading from the S2 to the S2 Max. Your site says 60 km but my friend says he gets way less. What's the real number?$t$,
  $t$Hi {first},

Great question, and your friend isn't wrong. The 60 km is measured at 15 km/h on flat ground with a 75 kg rider. In real city riding, with hills, stops and full speed, most riders get 40 to 45 km from the S2 Max. That's still about double what your S2 does on the same route.

Cold weather takes another 10 to 15% off, so winter commutes feel shorter.

If you tell me your daily distance, I can tell you whether the Max makes sense for you.

Ride safe,
{agent} at Voltra$t$,
  $t$Honest and specific. The trade-in offer for S2 owners would have closed it, otherwise great.$t$
),
(
  'voltra-where-is-it', 'voltra', 'good', 4, '{}', null,
  'Where is my scooter?',
  $t$Ordered an S2 last week, order {order}. Still no shipping email. Did something go wrong?$t$,
  $t$Hi {first},

Nothing went wrong, I checked your order. Your S2 left our warehouse yesterday and the carrier expects to deliver it on Thursday. The shipping email may have landed in spam, so here is the tracking link: track.voltra.example/{order}

Ride safe,
{agent} at Voltra$t$,
  $t$Checked the order, gave the tracking. Good.$t$
),
(
  'voltra-third-time', 'voltra', 'good', 5, '{}', null,
  'Third time writing about my order',
  $t$This is the third time I'm writing. You charged me two weeks ago and I still have NOTHING. Order {order}. I want my money back.$t$,
  $t$Hi {first},

You're right to be frustrated, and I'm sorry you had to write three times. I've read your earlier messages and checked the order myself: your S2 was held at our warehouse because the address was missing a flat number, and nobody told you. That's on us.

I've added the flat number from your first email and moved the order to express. It leaves today and arrives on Thursday. Tracking: track.voltra.example/{order}

If you'd still rather cancel, reply "cancel" and I'll refund you in full today, no need to wait for the parcel.

Ride safe,
{agent} at Voltra$t$,
  $t$Read the history, found the real problem, owned it, and gave them a real choice. Every new joiner should read this one.$t$
),
(
  'voltra-beeping', 'voltra', 'ok', 3, '{voltra.resolution}', null,
  'Scooter beeps when I brake',
  $t$My S2 beeps twice every time I brake since the last app update. Is that normal?$t$,
  $t$Hi {first},

Thanks for reaching out! The beeping can have several causes. Firmware updates sometimes change how the scooter signals braking, and some riders find the sounds useful. It can also be related to the brake sensor or to settings in the app. Our scooters are designed to keep you informed while you ride, so sounds are a normal part of how they communicate.

Let us know if there's anything else we can help with!

Ride safe,
{agent} at Voltra$t$,
  $t$Nothing wrong in here, and nothing useful either. Update 2.4 added a brake chime you can turn off in Settings > Sounds. Say that and they don't write back.$t$
),
(
  'voltra-refund-first', 'voltra', 'bad', 2, '{voltra.diagnose}', null,
  'Won''t turn on after two weeks in the garage',
  $t$Scooter won't turn on after I left it in the garage for two weeks. Pretty disappointed for something this expensive.$t$,
  $t$Hi {first},

I'm so sorry to hear that! That's definitely not the experience we want you to have. I've gone ahead and started a return for you, and you'll receive a prepaid label by email within 24 hours. Once we receive the scooter we'll process your refund.

Ride safe,
{agent} at Voltra$t$,
  $t$A scooter that sat for two weeks is almost always a sleeping battery: charge it for 3 hours and hold power for 10 seconds. We just paid return shipping on a working scooter. Diagnose first, every time.$t$
),
(
  'voltra-wrong-warranty', 'voltra', 'bad', 1, '{voltra.accuracy,voltra.order-history,voltra.tone}', null,
  'Battery only holds half the charge',
  $t$My S2 Max battery only holds half the charge it used to. I bought it 14 months ago. Is this covered?$t$,
  $t$Hello,

Unfortunately the battery warranty on our scooters is 6 months, so your battery is no longer covered. Batteries lose capacity over time, this is normal. You can buy a replacement battery on our website or use any 42V charger to charge more often.

Regards,
Voltra Support$t$,
  $t$Three wrong things in five lines. The battery warranty is 12 months, not 6. The order history shows the battery was replaced in March, so this one is covered until next March. And we never tell anyone to use "any 42V charger". If the brand had seen this we'd be having a very different conversation.$t$
),
(
  'voltra-latch', 'voltra', 'bad', 2, '{voltra.relevance,voltra.resolution}', null,
  'Folding latch clicks over bumps',
  $t$The folding latch on my S2 has started clicking when I ride over bumps. Is it safe to keep riding?$t$,
  $t$Hi {first},

Thanks for getting in touch! Clicking over bumps is usually down to tyre pressure. The S2 tyres should be at 50 psi, and they lose a little air every week, so it's worth checking them every couple of weeks with a pump that has a gauge.

Ride safe,
{agent} at Voltra$t$,
  $t$They asked whether it's safe to ride with a clicking latch. That's a safety question and it went unanswered. The latch needs a quarter turn with the hex key, and until then they shouldn't ride it.$t$
),
(
  'boxwell-shortage', 'boxwell', 'good', 5, '{}', null,
  'Short delivery on double-wall cartons',
  $t$PO 4471 / order {order}. Delivered this morning, counted 38 cartons of BX-DW-12, invoice says 40.$t$,
  $t$Order {order}: 2 × BX-DW-12 short, confirmed against the packing record.
Reshipping 2 today on DPD, tracking by 17:00.
— Boxwell Support$t$,
  $t$Textbook. Order number, exact shortfall, same-day reship, three lines.$t$
),
(
  'boxwell-repeat-order', 'boxwell', 'good', 4, '{}', null,
  'Repeat last mailer order',
  $t$Can you repeat our last mailer order? Same quantities. Need it before the 20th.$t$,
  $t$Repeat of your last order: 5,000 × Kraft Mailer M3 and 120 × Tape 48mm clear.
In stock, ships tomorrow, DPD confirms delivery on the 18th.
New order {order} is in your inbox.
— Boxwell Support$t$,
  $t$Good. Quoting the old order back lets them check it at a glance.$t$
),
(
  'boxwell-invoice', 'boxwell', 'good', 4, '{}', null,
  'Invoice copy for accounts',
  $t$Can you resend the invoice for order {order}? Accounts can't find it.$t$,
  $t$Invoice for order {order} attached, and resent to the accounts address on file.
— Boxwell Support$t$,
  ''
),
(
  'boxwell-chatty', 'boxwell', 'ok', 3, '{boxwell.tone}', null,
  'Double-wall 400×300×300 in stock?',
  $t$Do you have the 400×300×300 double-wall in stock? Need 200.$t$,
  $t$Hi there!

Thanks so much for reaching out to Boxwell, we really appreciate your business and it's always great to hear from you! I'm happy to let you know that I've checked with our warehouse team and we do currently have the 400×300×300 double-wall cartons (BX-DW-12) in stock. We have plenty available, so 200 won't be a problem at all.

If you'd like to go ahead, you can place the order on our website or simply reply to this email and I'll be happy to set it up for you. Please don't hesitate to reach out if there's anything else at all I can help with!

Warm regards,
{agent}$t$,
  $t$Right answer, wrong brand. A Boxwell customer wants "BX-DW-12: 200 in stock, ships today if you confirm by 14:00." That's the whole reply.$t$
),
(
  'boxwell-late-collection', 'boxwell', 'ok', 3, '{boxwell.speed}', 1560,
  'URGENT collection reference',
  $t$Urgent: our driver is here, can you confirm the collection reference for order {order}?$t$,
  $t$Collection reference for order {order}: COL-88213. Ready at bay 4.
— Boxwell Support$t$,
  $t$Perfect content, 26 hours late. The driver left yesterday. Anything with a driver waiting goes to the top of the queue.$t$
),
(
  'boxwell-split-shipment', 'boxwell', 'bad', 2, '{boxwell.order-history}', null,
  'Got the tape but no boxes',
  $t$Order {order}: we got the tape but no boxes. Where are the boxes?$t$,
  $t$Order {order} was delivered in full on Tuesday, signed for at your dock.
— Boxwell Support$t$,
  $t$The order history shows a split shipment: tape delivered, cartons back-ordered until Friday. We told them everything had arrived. This is the order-history problem again.$t$
),
(
  'boxwell-wrong-quantity', 'boxwell', 'bad', 1, '{boxwell.accuracy}', null,
  'Checking the invoice quantity',
  $t$Quick check before we sign off the invoice: order {order} is 5,000 mailers, right?$t$,
  $t$Order {order} shows 500 × Kraft Mailer M3, invoiced at €0.21 each.
— Boxwell Support$t$,
  $t$The order is 5,000. The customer had it right and we told them they were wrong, on an invoice question. Read the order line twice before you send a number.$t$
),
(
  'boxwell-guaranteed-monday', 'boxwell', 'bad', 2, '{boxwell.carrier}', null,
  'Pallet for our Monday launch',
  $t$Can you guarantee the pallet arrives Monday? We have a launch.$t$,
  $t$Order {order} will arrive Monday, guaranteed.
— Boxwell Support$t$,
  $t$The carrier had not confirmed Monday, and it arrived on Wednesday, after their launch. Say what is confirmed and offer the express upgrade. Never guarantee for the carrier.$t$
),
(
  'oddbird-skip', 'oddbird', 'good', 5, '{}', null,
  'Skip a delivery while I''m away',
  $t$Hey! Going on holiday for 3 weeks, can I skip my next delivery? Don't want beans going stale in the letterbox 😅$t$,
  $t$Hi {first}!

Done: your next Night Owl delivery is skipped, and the one after lands on {date}, the week you're back. No beans going stale in the letterbox.

Have a brilliant trip ☕

Brewing for you,
{agent} & the Oddbird crew$t$,
  $t$Did it, said when the next one comes, sounded like us.$t$
),
(
  'oddbird-stale-bag', 'oddbird', 'good', 4, '{}', null,
  'Early Bird tasted flat',
  $t$My last bag of Early Bird tasted flat and a bit papery. Roast date on the bag is almost 5 weeks old?$t$,
  $t$Hi {first},

That's not the Early Bird we roast, sorry! Five weeks is too old, and it shouldn't have left us like that. A fresh bag is on its way today, free, and there's no need to send anything back.

Could you tell me the batch number printed under the roast date? It helps us find out how an old bag slipped through.

Brewing for you,
{agent} & the Oddbird crew$t$,
  $t$Great. Asking for the batch number is exactly the procedure.$t$
),
(
  'oddbird-gift', 'oddbird', 'good', 4, '{}', null,
  'Gift subscription for my dad',
  $t$Can I send a 3-month subscription to my dad as a gift? His birthday is on the 12th.$t$,
  $t$Hi {first},

What a lovely present! A 3-month gift subscription is £39, and you can choose the first delivery date so it lands on the 12th: oddbird.example/gift

Add a note at checkout and we'll hand-write it on the card.

Brewing for you,
{agent} & the Oddbird crew$t$,
  ''
),
(
  'oddbird-pause-homework', 'oddbird', 'ok', 3, '{oddbird.do-it}', null,
  'Pause for a month',
  $t$Can I pause my subscription for a month? Money's a bit tight.$t$,
  $t$Hi {first},

Of course! You can pause any time from your account: go to My Subscription, tap "Manage", choose "Pause" and pick how long. It takes effect before your next billing date.

Brewing for you,
{agent} & the Oddbird crew$t$,
  $t$Kind and correct, but we could have paused it ourselves in ten seconds. Someone who says money is tight shouldn't get homework.$t$
),
(
  'oddbird-dear-customer', 'oddbird', 'ok', 3, '{oddbird.tone}', null,
  'Switch to ground for the cafetière',
  $t$Can I switch from whole bean to ground for the cafetière?$t$,
  $t$Dear customer,

Thank you for contacting Oddbird Coffee. I have updated the grind setting on your subscription from whole bean to coarse (cafetière). Please note the following:

1. The change applies from your next delivery onwards.
2. Ground coffee loses freshness faster than whole bean. We recommend using it within two weeks of opening.
3. Should you experience any issues, please do not hesitate to contact us.

Kind regards,
Oddbird Customer Support$t$,
  $t$Right thing, wrong voice: this reads like a scooter manual. Oddbird is "Done! Coarse grind from your next bag ☕".$t$
),
(
  'oddbird-double-charge', 'oddbird', 'bad', 1, '{oddbird.accuracy}', null,
  'Charged twice this month?',
  $t$I was charged twice this month?? £14 on the 3rd and again on the 17th.$t$,
  $t$Hi {first},

No worries, that's not a double charge! Your plan is every 2 weeks, so the 3rd and the 17th are your two regular deliveries.

Brewing for you,
{agent} & the Oddbird crew$t$,
  $t$Their subscription page says every 4 weeks. The second charge was a duplicate and we told them it wasn't. Check the subscription page before any billing answer.$t$
),
(
  'oddbird-decaf', 'oddbird', 'bad', 2, '{oddbird.relevance,oddbird.resolution}', null,
  'Do you do a decaf?',
  $t$Do you have a decaf? My partner can't have caffeine after 2pm but loves the Night Owl.$t$,
  $t$Hi {first},

Great to hear you're enjoying the Night Owl! We ship every Tuesday and Thursday, and deliveries usually arrive in 1–2 working days.

Brewing for you,
{agent} & the Oddbird crew$t$,
  $t$Answered a question nobody asked. We have Sleepy Wren, a Swiss Water decaf. That was the whole answer, and a sale.$t$
);

create temp table seed_customers (brand text, idx int, full_name text);

insert into seed_customers
select 'voltra', i - 1, n from unnest(array[
  'Alex Moreno', 'Priya Shah', 'Tom Becker', 'Lucía Fernández', 'Jonas Weber', 'Emma Clarke',
  'Karim Haddad', 'Sara Lindqvist', 'Marco Rossi', 'Hannah Doyle', 'Ben Okafor', 'Chloé Martin'
]) with ordinality as t(n, i)
union all
select 'boxwell', i - 1, n from unnest(array[
  'Ruth Adams (Linden & Co.)', 'Pip Morgan (Pip''s Candles)', 'Omar Said (Northfold Print)',
  'Jess Lowe (Harbour Ceramics)', 'Ana Costa (Greenleaf Tea)', 'Will Grant (Grant Outdoor)',
  'Mei Tan (Paper Moon Studio)', 'Carl Jensen (Nordic Pantry)'
]) with ordinality as t(n, i)
union all
select 'oddbird', i - 1, n from unnest(array[
  'Olivia Hart', 'Sam Reyes', 'Nina Kowalski', 'Jake Turner', 'Aisha Bello', 'Finn Murphy',
  'Rosa Delgado', 'Theo Walsh', 'Grace Kim', 'Leon Fischer'
]) with ordinality as t(n, i);

-- History: nine weeks of replies ---------------------------------------------------
-- Each reply picks a template. The odds of a bad one depend on the brand, the
-- specialist and how long ago it was, which is where the stories come from.

create temp table seed_history as
with slots as (
  select b.slug as brand, b.brand_id, b.lead, d.days_ago, s.slot,
         b.specialists[1 + (s.slot % 2)] as specialist,
         (d.days_ago - 2) / 7 as weeks_ago,
         pg_temp.rnd(format('quality:%s:%s:%s', b.slug, d.days_ago, s.slot)) as u_quality,
         pg_temp.rnd(format('template:%s:%s:%s', b.slug, d.days_ago, s.slot)) as u_template
  from seed_brands b
  cross join generate_series(2, 64) as d(days_ago)
  cross join lateral generate_series(0, b.per_day - 1) as s(slot)
),
odds as (
  select *,
    case
      when brand = 'voltra' and specialist = 'sofia' then 0.05 + 0.06 * weeks_ago
      when brand = 'voltra' then 0.07 + 0.02 * weeks_ago
      when brand = 'boxwell' and specialist = 'leo' and weeks_ago between 4 and 7 then 0.55
      else 0.07
    end as p_bad,
    case when brand = 'oddbird' and specialist = 'dani' then 0.35 else 0.18 end as p_ok
  from slots
),
graded as (
  select *,
    case
      when u_quality < p_bad then 'bad'
      when u_quality < p_bad + p_ok then 'ok'
      else 'good'
    end as quality
  from odds
),
pool as (
  select key, brand, quality,
         row_number() over (partition by brand, quality order by key) - 1 as idx,
         count(*) over (partition by brand, quality) as n
  from seed_templates
)
select g.*,
  case
    when g.brand = 'voltra'  and g.specialist = 'sofia' and g.quality = 'bad' and g.u_template < 0.7 then 'voltra-refund-first'
    when g.brand = 'boxwell' and g.specialist = 'leo'   and g.quality = 'bad' and g.weeks_ago between 4 and 7 then 'boxwell-split-shipment'
    when g.brand = 'oddbird' and g.specialist = 'dani'  and g.quality = 'ok'  and g.u_template < 0.7 then 'oddbird-dear-customer'
    else p.key
  end as template,
  md5(format('reply:%s:%s:%s', g.brand, g.days_ago, g.slot))::uuid as reply_id,
  (current_date - g.days_ago)::timestamptz
    + interval '8 hours'
    + g.slot * interval '45 minutes'
    + pg_temp.rnd(format('minute:%s:%s:%s', g.brand, g.days_ago, g.slot)) * interval '40 minutes' as sent_at
from graded g
join pool p on p.brand = g.brand and p.quality = g.quality
           and p.idx = floor(g.u_template * p.n)::int;

-- Yesterday: one reply per template and brand, none reviewed yet ----------------
-- Two per brand fall in the daily sample: one excellent, one that should not
-- have gone out. The id is searched for so the hash lands on the right side.

create temp table seed_yesterday (template text primary key, specialist text, in_sample boolean);

insert into seed_yesterday values
  ('voltra-e10',               'dani',  true),
  ('voltra-wrong-warranty',    'sofia', true),
  ('voltra-range',             'sofia', false),
  ('voltra-where-is-it',       'dani',  false),
  ('voltra-third-time',        'sofia', false),
  ('voltra-beeping',           'dani',  false),
  ('voltra-refund-first',      'sofia', false),
  ('voltra-latch',             'dani',  false),
  ('boxwell-shortage',         'sofia', true),
  ('boxwell-split-shipment',   'leo',   true),
  ('boxwell-repeat-order',     'leo',   false),
  ('boxwell-invoice',          'sofia', false),
  ('boxwell-chatty',           'sofia', false),
  ('boxwell-late-collection',  'leo',   false),
  ('boxwell-wrong-quantity',   'leo',   false),
  ('boxwell-guaranteed-monday','sofia', false),
  ('oddbird-skip',             'leo',   true),
  ('oddbird-dear-customer',    'dani',  true),
  ('oddbird-stale-bag',        'dani',  false),
  ('oddbird-gift',             'leo',   false),
  ('oddbird-pause-homework',   'dani',  false),
  ('oddbird-double-charge',    'leo',   false),
  ('oddbird-decaf',            'dani',  false);

insert into seed_history (brand, brand_id, lead, days_ago, slot, specialist, weeks_ago, quality, template, reply_id, sent_at)
select t.brand, sb.brand_id, sb.lead, 1,
       row_number() over (partition by t.brand order by y.template)::int - 1,
       y.specialist, 0, t.quality, y.template,
       (select c.id
          from generate_series(0, 999) as i,
               lateral (select md5(format('yesterday:%s:%s', y.template, i))::uuid as id) c
         where (pg_temp.bucket(c.id) < b.sample_rate * 10000) = y.in_sample
         order by i
         limit 1),
       (current_date - 1)::timestamptz + interval '8 hours'
         + (row_number() over (partition by t.brand order by y.template) - 1) * interval '52 minutes'
from seed_yesterday y
join seed_templates t on t.key = y.template
join seed_brands sb on sb.slug = t.brand
join public.brands b on b.id = sb.brand_id;

-- Replies ----------------------------------------------------------------------------

insert into public.replies (
  id, brand_id, specialist_id, source, external_id, ticket_ref, subject,
  customer_name, customer_message, customer_wrote_at, body, sent_at
)
select
  h.reply_id, sb.brand_id, sp.person_id, 'seed',
  format('%s-%s-%s', h.brand, h.days_ago, h.slot),
  sb.ticket_prefix || (20000 + (70 - h.days_ago) * 20 + h.slot),
  t.subject,
  c.full_name,
  replace(replace(t.customer_message, '{order}', o.order_no), '{first}', split_part(c.full_name, ' ', 1)),
  h.sent_at - coalesce(t.delay_minutes, 20 + floor(pg_temp.rnd('delay:' || h.reply_id) * 160)::int) * interval '1 minute',
  replace(replace(replace(replace(t.body,
    '{first}', split_part(c.full_name, ' ', 1)),
    '{order}', o.order_no),
    '{agent}', split_part(sp.full_name, ' ', 1)),
    '{date}', to_char(h.sent_at + interval '35 days', 'FMDD FMMonth')),
  h.sent_at
from seed_history h
join seed_brands sb on sb.slug = h.brand
join seed_people sp on sp.key = h.specialist
join seed_templates t on t.key = h.template
join seed_customers c on c.brand = h.brand
  and c.idx = floor(pg_temp.rnd('customer:' || h.reply_id) * (select count(*) from seed_customers x where x.brand = h.brand))::int
cross join lateral (
  select sb.order_prefix || (10000 + floor(pg_temp.rnd('order:' || h.reply_id) * 89999)::int) as order_no
) o;

-- Reviews on history ---------------------------------------------------------------
-- The lead reviews most of the daily sample, and now and then hand-picks a
-- reply that looked off. Nothing from yesterday is reviewed yet.

insert into public.reviews (reply_id, brand_id, reviewer_id, score, note, created_at, updated_at)
select
  r.id, r.brand_id, lead.person_id,
  greatest(1, least(5, t.score + case
    when pg_temp.rnd('noise:' || r.id) < 0.12 then -1
    when pg_temp.rnd('noise:' || r.id) > 0.90 then 1
    else 0
  end)),
  case when t.quality = 'good' and pg_temp.rnd('note:' || r.id) < 0.5 then '' else t.note end,
  r.sent_at + interval '18 hours',
  r.sent_at + interval '18 hours'
from seed_history h
join public.replies r on r.id = h.reply_id
join public.brands b on b.id = r.brand_id
join seed_templates t on t.key = h.template
join seed_people lead on lead.key = h.lead
where h.days_ago >= 2
  and (
    (r.sample_bucket < b.sample_rate * 10000 and pg_temp.rnd('reviewed:' || r.id) < 0.85)
    or (r.sample_bucket >= b.sample_rate * 10000 and h.quality = 'bad' and pg_temp.rnd('targeted:' || r.id) < 0.3)
  );

insert into public.review_flags (review_id, criterion_id, brand_id)
select rv.id, md5('criterion:' || f.key)::uuid, rv.brand_id
from public.reviews rv
join seed_history h on h.reply_id = rv.reply_id
join seed_templates t on t.key = h.template
cross join lateral unnest(t.flags) as f(key);
