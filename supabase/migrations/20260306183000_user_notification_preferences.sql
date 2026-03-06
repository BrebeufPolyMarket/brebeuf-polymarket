alter table public.users
  add column if not exists notify_market_close boolean not null default true,
  add column if not exists notify_watchlist_move boolean not null default true,
  add column if not exists notify_house_events boolean not null default true,
  add column if not exists notify_comment_replies boolean not null default true;

comment on column public.users.notify_market_close is
  'Notify user when watchlisted markets are closing soon.';

comment on column public.users.notify_watchlist_move is
  'Notify user when watchlisted market probabilities move significantly.';

comment on column public.users.notify_house_events is
  'Notify user about House Cup lead and standing change events.';

comment on column public.users.notify_comment_replies is
  'Notify user when someone replies to their comment.';
