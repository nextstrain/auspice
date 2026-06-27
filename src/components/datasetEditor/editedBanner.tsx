import React  from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { AppDispatch, RootState } from "../../store";
import { auspiceJSON } from "../download/helperFunctions";
import { getFilePrefix } from "../download/downloadButtons";

const Banner = styled.div`
  height: 20px;
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ff8533;
  color: white;
  font-size: 20px;

  button {
    background: inherit;
    color: inherit;
    border: none;
    text-decoration: underline;
  }
`;


export default function EditedBanner(): JSX.Element {
  const { t } = useTranslation();
  const dispatch: AppDispatch = useDispatch();

  // Access the entire state as we'll need it to download JSON
  const state = useSelector((state: RootState) => state);
  if (!state.metadata.loaded) throw new Error("[INTERNAL ERROR] metadata state not loaded");

  function handleDownload(): void {
    const filePrefix: string = getFilePrefix();
    auspiceJSON(dispatch, state, filePrefix);
  }

  return (
    <Banner>
      {t("This dataset has been edited")}
      {state.metadata.sharing.dataset_json && (
        <>
          <button onClick={handleDownload}>
            {t("Click to download")}
          </button>
          {t("the modified JSON.")}
        </>
      )}
    </Banner>
  )
}
