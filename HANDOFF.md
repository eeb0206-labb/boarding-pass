# Boarding Pass — Setup Guide for Joe

## What is this?
The Boarding Pass website: a pitch site for travel brands. We trade creative work for travel.
Live URL: (will be your Netlify URL once deployed)
GitHub repo: https://github.com/eeb0206-labb/boarding-pass

---

## Accounts

### Gmail
- Email: boardingpass.je@gmail.com
- Password: (Ethan will share this with you in person or via message)

### Formspree (contact form backend)
- Logged in with the Gmail above
- Messages from the site go straight to the Gmail inbox
- Endpoint already wired into the site, no action needed

### Netlify (hosting)
- Logged in via GitHub (Ethan's account)
- Auto-deploys when you push to GitHub
- No action needed from you

### ntfy (push notifications)
1. Download the ntfy app (iOS App Store or Google Play)
2. Open it, tap +, subscribe to topic: boarding-pass-je
3. You'll get a notification on your phone whenever someone visits the site
4. Shows: their location, company/ISP, device, where they came from, time on site

---

## How to edit the site

### Setup (one time)
1. Open Terminal
2. Run: git clone https://github.com/eeb0206-labb/boarding-pass.git ~/Desktop/boarding-pass
3. Open Claude Code in that folder

### Before you start editing
Tell Claude: "pull the latest changes from the boarding-pass repo"

### Making changes
Just tell Claude what you want to change. Examples:
- "Update the pitch copy to say..."
- "Add a new work item to the portfolio with this image"
- "Change Joe's bio to say..."
- "Add Germany to the visited countries"

### When you're done
Tell Claude: "commit and push my changes to the boarding-pass repo"

### IMPORTANT: Don't edit at the same time as Ethan
Text each other: "I'm working on the site" / "I'm done"
If you both edit at the same time you'll get merge conflicts.

---

## File structure

```
boarding-pass/
  index.html          The page (all sections)
  style.css           All styling
  script.js           Animations, ntfy notifications, lightbox
  _redirects           Netlify routing
  images/
    boarding-pass-logo.png   The logo
    shilouette.png           Skyline silhouette for the hero
    plane.png                Plane icon
    us/                      Photos of us (headshots, travel pics)
    work/                    Portfolio work images
    stamps/                  Passport stamp PNGs (optional)
```

---

## How to add portfolio work

1. Save your image to images/work/ (e.g. images/work/ski-campaign.jpg)
2. In index.html, find the work-grid section and add a new item:

```html
<div class="work-item reveal" data-title="Project Name" data-brief="What the project was about.">
  <img src="images/work/ski-campaign.jpg" alt="Project Name" loading="lazy">
  <div class="work-overlay">
    <span class="work-type handwritten">Campaign</span>
    <h3>Project Name</h3>
  </div>
</div>
```

Use class="wide" to make it span 2 columns, class="tall" for 2 rows.

---

## How to update crew photos

Replace the avatar divs with real images:

Change this:
```html
<div class="crew-avatar">J</div>
```

To this:
```html
<img src="images/us/joe.jpg" class="crew-avatar-img" alt="Joe">
```

---

## How to add visited countries (if map is re-added)

In script.js, find the visitedIds object and add the country's numeric ISO code:
```js
276: 'Germany',
191: 'Croatia',
```
Codes: https://en.wikipedia.org/wiki/ISO_3166-1_numeric

---

## Key URLs
- GitHub repo: https://github.com/eeb0206-labb/boarding-pass
- Ethan's portfolio: https://bookofbrown.netlify.app
- Joe's portfolio: https://joecalveyportfolio.netlify.app/portfolio
- Formspree dashboard: https://formspree.io (login with Gmail)
- ntfy topic: https://ntfy.sh/boarding-pass-je
