# media-submissions

Media Submissions is a Discord bot that allows you to configure fully automatic, and user-driven, picture/clip of the week/month channels.

> This project was funded and open-sourced by [DayZ The Lab](https://dayzthelab.com).

## How does it work?

You can specify which channels users should upload their media in, wether it's of the `picture`, `clip` or `either` type, and when a winner should be chosen.

When a user uploads a message **with** the specified media in the channel, the `👍` and `👍` emojis will be added to the message, allowing the community to cast their votes. Any message that does **not** have the specified media attached will be deleted, keeping the submission channels clean of any (potentially unwanted) user feedback.

## Configuration

Every aspect of this app and it's functionality is configurable, including:

- The media type: `picture`, `clip` or `either`
- The time frame: How long do submissions run/when is a winner chosen?
- The emojis used to cast votes: `👍` and `👍` by default
- Submission and forwarding channels
  - In which channel should users post their media?
  - In which channel should the winning submissions be posted?
- Submission validation: You can allow user feedback in submission channels
- Media sources: `discord`, `medal` and `youtube` by default
- The submission cooldown - separate from channel slow-mode
- Submission quantity: Should only 1 media attachment be allowed, or a gallery/collection of multiple entries?
- Discussion Threads: Should a public thread be attached to submissions to allow organized feedback?
