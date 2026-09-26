# Decisions

## Product

### The real problem

Leads know a good reply from a bad one, but today that opinion ends up in a Slack message and is lost. So nobody can coach from it, show a client that things are improving, or catch a problem like the order history one early. And "good" is different for each brand.

### What I built first

I read it as a reviewing problem. The trend for clients and the library of examples both use the scores. If the scores are not reliable, nothing built on them is. So I made reviewing reliable first:

1. A random sample, not "the ones that look bad". Every day, 20 to 25% of each brand's replies go into the sample, chosen at random. Nobody can change the choice. Leads can review other replies too, but those never count in the trend, because they are usually the bad ones: in the seed they average 1.8, against 3.7 for the sample.
2. One scale for every lead. 1 to 5, with a short description next to each score.
3. A checklist per brand. The lead ticks what the reply missed and writes a note to the specialist.
4. "Save and next" opens the next reply in the sample.

On top of that: a feedback page for the specialist, and a brand page the lead can show a client (the trend, the common mistakes, and how much of the sample was reviewed).

### Left out

1. The library of good and bad examples. It is the easiest next step, a filter over scores and notes we already save.
2. "What we changed" notes on the brand page, to show to the brand. This is the next thing I would build, along with the library.
3. Client export, editing checklists and sample rates, notifications, comparing leads' scores.
4. Importing replies from the helpdesk. Not built, but the data model is ready for it.

### Where AI would help: finding risky replies, never scoring

A model could read every reply and flag dangerous mistakes, like a wrong product fact, for the lead to review. It would never change a score or the trend. It would need a product sheet per brand. Before trusting it, I would compare its flags with the leads' reviews, and a person would approve each flag.

A second idea, outside this tool: an "AI Draft" button in the helpdesk, where specialists write. It would use the brand's voice, its procedures and the customer's message to write a draft. The specialist edits it and decides whether to send it. The button never sends anything. The scores in this tool would then show whether drafted replies are better or worse than the others.

### Questions before a V2

1. Should Marta see Dani's work on Nuria's brand?
2. What does a client get: a number, a PDF, a page?
3. How many replies per brand per day, and how many can a lead review? That sets the sample size.

## Architecture

### Shape

Pages are built on the server and read data as the signed in user.

### Data model

1. Each brand is a separate client. Every row belongs to one brand, and the database checks it. A review can't point to another brand's reply.
2. Roles are per brand. A lead's team is whoever writes for the brands she leads.
3. Checklist points and replies are never edited. A changed point is a new row, so old reviews keep their meaning. Each reply keeps its helpdesk id, so a future import won't duplicate replies or touch reviews.
4. People are separate from logins, so an imported specialist can exist before signing in.
5. The database marks each review "sample" or "picked by hand". The app can't choose.

### Authorisation lives in the database

Every table has rules that say which rows each user can see (Postgres row level security). Why there: Supabase has a public API that talks to the database directly, without going through our app. If the rules were only in our app, someone could skip them by using that API, which is exactly the test in the brief. With the rules in the database, every way in follows the same rules: our pages, the API or a script. Our app also checks who you are, but only to decide what to show on screen.

A specialist who asks for another brand's data gets an empty list: for them it doesn't exist, and an error would reveal that it does. Writing without permission, or asking without a login, gives an error.

Averages and saving a review run with the user's own permissions, so they can't leak other brands' data.

The fake login opens a real Supabase session, so the rules work as with a real login.

### What a real login would need

SSO instead of `signInAs`, linking each person to their login on first sign in, and deleting the demo accounts. The rules stay the same.

### What breaks first

1. The brand page counts all the reviews again every time it opens. That is fast with 3 brands, but slow with 50. The fix is to count each week once when it ends, and save the result.
2. Days are in UTC. In Buenos Aires, "yesterday" starts at 21:00.
3. Sample rates are a fixed percentage. With real volume, they should depend on how much a lead can review.
4. The brand page makes one query per specialist.

## AI

### How I worked

Claude Code wrote the code and opened every PR. We agreed on the reading, the data model and the security before any code. The agent also reviewed each PR. I chose which problems were real and posted them as review comments. The agent fixed them in new commits on the same branch.

### Where the agent was right

1. Sign ups (PR #1): I asked to turn them off in two places. It turned off one and explained why: the other also blocks the demo accounts from signing in.
2. Error messages: Reviewing another brand's reply now says "reply not found", whether the reply exists or not, so the error reveals nothing.

### Where I corrected it

1. PR size: PR #4 had 1,256 lines (almost 700 written by hand), too much for a five minute review. Every PR after it has fewer than 500.
2. Simpler code: I asked for code I can explain line by line, so the review form became a simple server form without keyboard shortcuts.

### An excerpt I like

The first score colours were a rainbow. Instead of trusting its eye, the agent tested them with a colour blindness checker (trimmed):

```
#b32322,#bd5b00,#997c30,#387b58,#00644f
  [FAIL] CVD separation         worst adjacent #997c30↔#bd5b00 ΔE 2.6 (deutan) · tritan 7.2
  [FAIL] Normal-vision floor    worst adjacent #00644f↔#387b58 ΔE 8.3 (normal) — below 15, hard to tell apart even with full color vision

#b32322,#d47452,#c0bdb8,#009aa8,#00627f
  [PASS] CVD separation         worst adjacent #009aa8↔#c0bdb8 ΔE 13.9 (protan) · tritan 15.3
  [PASS] Normal-vision floor    worst adjacent #00627f↔#009aa8 ΔE 16.9 (normal)
```

## Status

### Finished

The review loop, the feedback page, the brand page with its trend, the security tests, the seed and the README.

### Half done

1. Checklists and sample rates can only change in the seed.
2. A missing brand or reply shows the "not found" page, but the server answers 200, not 404.
3. Days are in UTC, and times on screen say so.

### Not started

Import, export, the examples library, notifications, comparing leads' scores, dark mode.

### Next, in order

1. "What we changed" notes
2. The examples library
3. Time zones per team
4. A helpdesk import
5. SSO
6. Counting each week once when it ends and saving the result, so the system doesn't slow down

### Tests

Security first, because it is the one problem you can't see in the UI. Then saving reviews and the numbers: 40 database tests, run as a visitor, a lead and two specialists. An end to end test of the review loop would be next. Finishing the brand page mattered more.

### What I would flag first in someone else's PR: `signInAs`

Anyone can use it to sign in as any demo account, and the password is in the README on purpose. In a real product, that would let people steal accounts. I kept it because the brief says a user switcher is fine. It only works for the local demo accounts, and it is the first thing to delete when SSO comes.
