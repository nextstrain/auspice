import React, { useState, Dispatch } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { FaTrashAlt } from "react-icons/fa";
import { RootState } from "../../store";
import Flex from "../framework/flex";

const DatasetEditorForm = styled.form`
  /* Using border-box so row/columns work as expected */
  * {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }
  *:before,
  *:after {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0.3em;
  }

  input {
    margin-bottom: 1em;
    width: 100%;
  }

  textarea {
    margin-bottom: 1em;
    width: 100%;
    resize: vertical;
    min-height: 1.5em;
    max-height: 50em;
  }

  .underlined {
    margin-bottom: 1em;
    text-decoration: underline;
  }
`;



interface NameAndUrl {
  name: string
  url: string
}

interface NameAndUrlState extends NameAndUrl {
  id: number
}

function convertToNameAndUrlState(metadata: NameAndUrl[]): NameAndUrlState[] {
  return metadata.map((item, idx): NameAndUrlState => ({...item, id: idx}));
}

function convertToNameAndUrl(state: NameAndUrlState[]): NameAndUrl[] {
  return state.map((item): NameAndUrl => {
    delete item.id;
    return item;
  })
}

export default function DatasetEditor({
  dismissModal
}: {
  dismissModal: () => void
}): JSX.Element {
  const { t } = useTranslation();
  const metadata = useSelector((state: RootState) => state.metadata);
  const [ title, setTitle ] = useState(metadata.title || "");
  const [ updated, setUpdated ] = useState(metadata.updated || "");
  const [ buildUrl, setBuildUrl ] = useState(metadata.buildUrl || "");
  const [ avatarUrl, setAvatarUrl ] = useState(metadata.buildAvatar || "");
  const [ warning, setWarning ] = useState(metadata.warning || "");
  const [ description, setDescription ] = useState(metadata.description || "");
  const [ maintainers, setMaintainers ] = useState<NameAndUrlState[]>(convertToNameAndUrlState(metadata.maintainers || []));
  const [ dataProvenances, setDataProvenances ] = useState<NameAndUrlState[]>(convertToNameAndUrlState(metadata.dataProvenance || []));

  function submit(event: React.FormEvent): void {
    event.preventDefault();

    // TODO: Dispatch updateMetadata
    console.log({
      title,
      updated,
      buildUrl,
      avatarUrl,
      warning,
      description,
      maintainers: convertToNameAndUrl(maintainers),
      dataProvenances: convertToNameAndUrl(dataProvenances),
    });

    dismissModal();
  }

  function addNameAndUrl(prevState: NameAndUrlState[], setState: Dispatch<NameAndUrlState[]>): void {
    setState([
      ...prevState,
      {
        id: prevState.length > 0 ? prevState.at(-1).id++ : 0,
        name: "",
        url: ""
      }
    ]);
  }

  function changeNameAndUrl(
    newItem: NameAndUrlState,
    prevState: NameAndUrlState[],
    setState: Dispatch<NameAndUrlState[]>
  ): void {
    setState(
      [...prevState].map((item) => {
        if (item.id === newItem.id) return newItem;
        return item
      })
    );
  }

  function deleteNameAndUrl(
    id: number,
    prevState: NameAndUrlState[],
    setState: Dispatch<NameAndUrlState[]>
  ): void {
    setState(
      [...prevState].filter((item) => item.id !== id)
    );
  }

  return (
    <DatasetEditorForm onSubmit={submit}>
      <div className="row">
        <div className="col-lg-6">
          <div className="row">
            <div className="col-lg-6">
              <label>
                {t("Dataset title")}:<br/>
                <input
                  type="text"
                  value={title}
                  onChange={(e): void => setTitle(e.currentTarget.value)}/>
              </label>
            </div>
            <div className="col-lg-6">
              <label>
                {t("Date updated")}:<br/>
                <input
                  type="date"
                  value={updated}
                  onChange={(e): void => setUpdated(e.currentTarget.value)}/>
              </label>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <label>
                {t("Build URL")}:<br/>
                <input
                  type="url"
                  value={buildUrl}
                  onChange={(e): void => setBuildUrl(e.currentTarget.value)}/>
              </label>
            </div>
            <div className="col-lg-6">
              <label>
                {t("Avatar URL")}:<br/>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e): void => setAvatarUrl(e.currentTarget.value)}/>
              </label>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12 underlined">
              {t("Maintainers")}:
            </div>
          </div>
          <NameAndUrlInputs
            data={maintainers}
            onChange={(newMaintainer): void => changeNameAndUrl(newMaintainer, maintainers, setMaintainers)}
            onDelete={(id): void => deleteNameAndUrl(id, maintainers, setMaintainers)}
          />
          <Flex>
            <button
              type="button"
              onClick={(): void => addNameAndUrl(maintainers, setMaintainers)}
            >
              {t("Add maintainer")}
            </button>
          </Flex>
          <div className="row">
            <div className="col-xs-12 underlined">
              {t("Data provenances")}:
            </div>
          </div>
          <NameAndUrlInputs
            data={dataProvenances}
            onChange={(newDataProvenance): void => changeNameAndUrl(newDataProvenance, dataProvenances, setDataProvenances)}
            onDelete={(id): void => deleteNameAndUrl(id, dataProvenances, setDataProvenances)}
          />
          <Flex>
            <button
              type="button"
              onClick={(): void => addNameAndUrl(dataProvenances, setDataProvenances)}
            >
              {t("Add data provenance")}
            </button>
          </Flex>
        </div>
        <div className="col-lg-6">
          <label>
            {t("Warning")}:<br/>
            <textarea
              value={warning}
              onChange={(e): void => setWarning(e.currentTarget.value)}/>
          </label>
          <label>
            {t("Description")}:<br/>
            <textarea
              value={description}
              onChange={(e): void => setDescription(e.currentTarget.value)}/>
          </label>
        </div>
      </div>
      <br/>
      <Flex>
        <button type="submit">{t("Submit")}</button>
      </Flex>
    </DatasetEditorForm>
  );
}

export const datasetEditorStyles = {
  container: (s: React.CSSProperties): React.CSSProperties => {
    s.backgroundColor = "rgba(0, 0, 0, .30)";
    return s
  },
  panel: (s: React.CSSProperties, browserDimensions: {width: number, height: number}): React.CSSProperties => {
    s.width = browserDimensions.width - 100;
    s.maxWidth = s.width;
    s.padding = "2em";
    s.color = "#1f2328";
    s.backgroundColor = "#ffffff";
    return s
  }
};


function NameAndUrlInputs({
  data,
  onChange,
  onDelete,
}: {
  data: NameAndUrlState[],
  onChange: (newData: NameAndUrlState) => void,
  onDelete: (id: number) => void,
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {data.map((item) =>
        <Flex key={item.id}>
          <div className="col-lg-6">
            <label>
              {t("Name")}:<br/>
              <input
                required
                type="text"
                value={item.name}
                onChange={(e): void => onChange({ ...item, name: e.currentTarget.value })}
              />
            </label>
          </div>
          <div className="col-lg-5">
            <label>
              {t("URL")}:<br/>
              <input
                type="url"
                value={item.url}
                onChange={(e): void => onChange({ ...item, url: e.currentTarget.value })}
              />
            </label>
          </div>
          <div className="col-lg-1">
            <button
              type="button"
              onClick={(): void => onDelete(item.id)}
            >
              <FaTrashAlt />
            </button>
          </div>
        </Flex>
      )}
    </>
  )
}
