import React from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import ReactTooltip from "react-tooltip";
import { FaPencilAlt } from "react-icons/fa";
import { SET_MODAL } from "../../actions/types";

const Button = styled.button`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  margin: 0.1em;
  padding: 0.1em;
  width: 1em;
  height: 1em;
`;

export default function EditButton(): JSX.Element {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const title="EditButton";
  return (
    <>
      <Button data-tip data-for={title}
        onClick={(): void => {
          dispatch({ type: SET_MODAL, modal: "datasetEditor" })
        }}
      >
        <FaPencilAlt />
      </Button>
      <ReactTooltip place="bottom" type="dark" effect="solid" id={title}>
        <>{t("Edit dataset")}</>
      </ReactTooltip>
    </>
  )
}
