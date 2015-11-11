export default [
  {
    'title': 'media',
    'type': 'section_title',
  },
  {
    'key': 'media',
    'type': 'select',
    'options': [
      {
        'key': 'on',
        'description': 'show thumbnails next to links',
      },
      {
        'key': 'off',
        'description': 'don\'t show thumbnails next to links',
      },
      {
        'key': 'subreddit',
        'description': 'show thumbnails based on each subreddit\'s media preferences',
      },
    ],
  },
  {
    'depends': 'over_18',
    'key': 'no_profanity',
    'description': 'make safe(r) for work',
  },


  {
    'title': 'link options',
    'type': 'section_title',
  },
  {
    'key': 'newwindow',
    'description': 'open links in a new window',
  },

  {
    'key': 'organic',
    'description': 'show the spotlight box on the front page',
  },
  {
    'key': 'show_trending',
    'description': 'show trending subreddits on the front page',
  },
  {
    'key': 'clickgadget',
    'description': 'show me links I\'ve recently viewed',
  },
  {
    'key': 'compress',
    'description': 'compress the link display',
  },
  {
    'key': 'domain_details',
    'description': 'show additional details in the domain text when available',
  },
  {
    'key': 'hide_ups',
    'description': 'don\'t show me submissions after I\'ve upvoted them',
  },
  {
    'key': 'hide_downs',
    'description': 'don\'t show me submissions after I\'ve downvoted them',
  },
  {
    'key': 'numsites',
    'description': 'number of links to display at once',
    'type': 'select',
    'options': [10, 25, 50, 100],
  },
  {
    'key': 'min_link_score',
    'description': 'minimum score to show links',
    'type': 'range',
    'min': -100,
    'max': 100,
  },

  {
    'title': 'comment options',
    'type': 'section_title',
  },
  {
    'key': 'default_comment_sort',
    'description': 'default comments sort',
    'type': 'select',
    'options': ['best', 'old', 'top', 'q&a', 'controversial', 'new'],
  },
  {
    'key': 'ignore_suggested_sort',
    'description': 'ignore suggested sorts',
  },
  {
    'key': 'highlight_controversial',
    'description': 'show a dagger (†) on comments voted controversial',
  },
  {
    'key': 'min_comment_score',
    'description': 'minimum score to show comments',
    'type': 'range',
    'min': -100,
    'max': 100,
  },
  {
    'key': 'num_comments',
    'description': 'default number of comments displayed',
    'type': 'range',
    'min': 0,
    'max': 200,
  },

  // messaging options
  {
    'title': 'messaging options',
    'type': 'section_title',
  },
  {
    'key': 'threaded_messages',
    'description': 'show message conversations in the inbox',
  },
  {
    'key': 'collapse_read_messages',
    'description': 'collapse messages after I\'ve read them',
  },
  {
    'key': 'mark_messages_read',
    'description': 'mark messages as read when I open my inbox',
  },
  {
    'key': 'monitor_mentions',
    'description': 'notify me when people say my username',
  },
  {
    'key': 'email_messages',
    'description': 'send messages as emails',
  },
  {
    'key': 'threaded_modmail',
    'description': 'enable threaded modmail display',
  },

  // display options
  {
    'title': 'display options',
    'type': 'section_title',
  },
  {
    'key': 'show_stylesheets',
    'description': 'allow subreddits to show me custom themes',
  },
  {
    'key': 'show_flair',
    'description': 'show user flair',
  },
  {
    'key': 'show_link_flair',
    'description': 'show link flair',
  },
  {
    'key': 'show_promote',
    'description': 'show self-serve advertising tab on front page',
  },
  {
    'key': 'legacy_search',
    'description': 'show legacy search page',
  },

  // content options
  {
    'title': 'content options',
    'type': 'section_title',
  },
  {
    'key': 'over_18',
    'description': 'I am over eighteen years old and willing to view adult content',
  },
  {
    'key': 'label_nsfw',
    'description': 'label posts that are not safe for work (NSFW)',
  },
  {
    'key': 'private_feeds',
    'description': 'enable private RSS feeds',
  },

  // privacy options
  {
    'title': 'privacy options',
    'type': 'section_title',
  },
  {
    'key': 'public_votes',
    'description': 'make my votes public',
  },
  {
    'key': 'research',
    'description': 'allow my data to be used for research purposes',
  },
  {
    'key': 'hide_from_robots',
    'description': 'don\'t allow search engines to index my user profile',
  },

  // beta
  {
    'title': 'beta options',
    'type': 'section_title',
  },
  {
    'key': 'beta',
    'description': 'I would like to beta test features for reddit',
  },
];

export const goldOptions = [
  {
    'title': 'gold options',
    'type': 'section_title',
  },
  {
    'key': 'hide_ads',
    'description': 'hide ads',
  },
  {
    'key': 'store_visits',
    'description': 'remember what links I\'ve visited',
  },
  {
    'key': 'highlight_new_comments',
    'description': 'highlight new comments',
  },
  {
    'key': 'show_gold_expiration',
    'description': 'show gold expiration',
  },
  {
    'key': 'creddit_autorenew',
    'description': 'use a creddit to automatically renew my gold if it expires',
  },
  {
    'key': 'enable_default_themes',
    'description': 'use reddit theme',
  },
];
