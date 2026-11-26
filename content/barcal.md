---
title: barcal
description: what barcal, my menu bar calendar for macos, does with google calendar data
template: page
---

# barcal

barcal is a menu bar calendar for macos that i built for myself. it is not offered to anyone else.

## privacy

- barcal signs in to google with oauth and reads and writes calendar events on the google accounts i sign in with. it asks for calendar access only.
- calendar data is stored only on the mac that runs barcal. the sign-in tokens are stored in that mac's keychain.
- barcal talks directly to google's apis. there is no barcal server and no analytics, and nothing received from google is sent to or shared with anyone else.
- when i add an event by typing a sentence, the sentence is read on the mac (by rules and apple's on-device language model), and names in it are matched against earlier events and this mac's contacts. one thing leaves the mac: the name of a place i typed ("sushi kisen") is looked up with apple maps to find its address. the event itself then goes to google, like any other.
- barcal's use of information received from google apis adheres to the [google api services user data policy](https://developers.google.com/terms/api-services-user-data-policy), including the limited use requirements.
- to remove barcal's access to an account, revoke it at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

questions: [sean@lingren.com](mailto:sean@lingren.com)
