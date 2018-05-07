import React from "react";
import TweetEmbed from 'react-tweet-embed';

/* find the tweet, copy the code via click down -> embed tweet,
paste in here, rename class -> className, and remove the data-lang="en"
bit from the first <blockquote> element
*/

export const tweets = () => (
  <div className="twitterRow">
    <div className="twitterColumn">
      <TweetEmbed id="841750279972352005" />
      <TweetEmbed id="836624541933694976" />
      <TweetEmbed id="730892338394959872" />
      <TweetEmbed id="836608830784036864" />
      <TweetEmbed id="804338351755010050" />
      <TweetEmbed id="612150119518093312" />
    </div>
    <div className="twitterColumn">
      <TweetEmbed id="836714016475078661" />
      <TweetEmbed id="629634451832766464" />
      <TweetEmbed id="804960157570662400" />
      <TweetEmbed id="638788232793169920" />
      <TweetEmbed id="783799220796923904" />
      <TweetEmbed id="698580389598752769" />
    </div>
  </div>
);
