import React, {useState, useEffect} from "react";
import styled from 'styled-components';
import githubLogo from '../../images/github.svg';

const Container = styled.div`
  margin: 5px;
  position: absolute;
  right: 20px;
  top: 20px;
`;

const AvatarContainer = styled.img`
  height: 40px;
  width: 40px;
  alt: "github avatar";
`;

const BuildURLContainer = styled.span`
  padding-right: 20px;
  font-size: 14px;
`;

const BuildUrl = ({url}) => {
  const prefixMatch = url.match(/https?:\/\/[w.]{0,4}(.+)/);
  const display = prefixMatch ? prefixMatch[1] : url;
  return (
    <BuildURLContainer>
      {"Build: "}
      <a href={url} target="_blank" rel="noopener noreferrer">{display}</a>
    </BuildURLContainer>
  );
};

/* to do - move to redux & source from JSON */
const tmpBuildInfo = {
  url: "https://github.com/blab/zika-colombia"
};

function arrayBufferToBase64(buffer) {
  /* https://medium.com/front-end-weekly/fetching-images-with-the-fetch-api-fb8761ed27b2 */
  let binary = '';
  [].slice.call(new Uint8Array(buffer))
    .forEach((b) => {binary += String.fromCharCode(b);});
  return window.btoa(binary);
}

export const SourceInfo = () => {
  const [avatar, setAvatar] = useState(null);
  const [buildInfo, setBuildInfo] = useState(tmpBuildInfo);

  async function fetchAvatar() {
    /* note -- cannot smply fetch https://github.com/${buildInfo.githubUser}.png?size=200 due to the lack of "Access-Control-Allow-Origin" header */
    try {
      const githubUsernameRegex = buildInfo.url.match(/github.com\/(\S+)\//);
      if (!githubUsernameRegex) {
        console.warn("non github build repository. Cannot set avatar");
        return;
      }
      const githubUsername = githubUsernameRegex[1];
      const githubUserInfoRes = await fetch(`https://api.github.com/users/${githubUsername}`, {mode: 'cors'});
      if (githubUserInfoRes.status !== 200) {
        throw new Error(githubUserInfoRes.statusText);
      }
      const githubUserInfo = await githubUserInfoRes.json();
      const avatarRes = await fetch(githubUserInfo.avatar_url, {mode: 'cors'});
      if (avatarRes.status !== 200) {
        throw new Error(avatarRes.statusText);
      }
      const imgSrc = await avatarRes.arrayBuffer()
        .then((buffer) => `data:image/jpeg;base64,${arrayBufferToBase64(buffer)}`);
      setAvatar(imgSrc);
    } catch (err) {
      console.log("CATCH", err);
      setAvatar(githubLogo);
    }
  }

  useEffect(() => {fetchAvatar();}, []);

  return (
    <Container>
      {buildInfo ? (<BuildUrl url={buildInfo.url}/>) : null}
      {avatar ? (<AvatarContainer src={avatar}/>) : null}
    </Container>
  );

};
