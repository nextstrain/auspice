import React, { useRef, useState, useEffect, Dispatch } from "react";
import { useDispatch } from "react-redux"
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { FaTrashAlt } from "react-icons/fa";
import Mousetrap from "mousetrap";
import { hasExtension, getExtension } from "../../util/extensions";
import { AppDispatch, RootState } from "../../store";
import { NameAndUrl, LegendPlacement, Metadata } from "../../reducers/metadata.types";
import { updateMetadata } from "../../actions/updateMetadata/updateMetadata";
import Flex from "../framework/flex";
import { DatasetEditorForm } from "./styles";

// Add stable id to state for React key
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
  const dispatch: AppDispatch = useDispatch();
  const metadata = useSelector((state: RootState) => state.metadata);
  if (!metadata.loaded) throw new Error("[INTERNAL ERROR] metadata state not loaded");

  const { legendPlacements } = metadata;
  const [ maintainers, setMaintainers ] = useState<NameAndUrlState[]>(convertToNameAndUrlState(metadata.maintainers || []));
  const [ dataProvenances, setDataProvenances ] = useState<NameAndUrlState[]>(convertToNameAndUrlState(metadata.dataProvenance || []));
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    Mousetrap.bind('enter', () => {
      formRef.current?.requestSubmit();
    });
    Mousetrap.bind('escape', () => {
      dismissModal();
    });
    return () => {
      Mousetrap.unbind('enter');
      Mousetrap.unbind('escape');
    };
  }, [dismissModal]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const updatedLegendPlacements = Object.fromEntries(
      Object.keys(legendPlacements).map(
        (panel) => [panel, inputPlacementToRedux(e.target[`${panel}Legend`].value)]
      )
    );

    dispatch(updateMetadata({
      edited: true,
      title: e.currentTarget.datasetTitle.value,
      updated: e.currentTarget.updated.value,
      buildUrl: e.currentTarget.buildUrl.value,
      buildAvatar: e.currentTarget.avatarUrl.value.trim() || undefined,
      warning: e.currentTarget.warning.value.trim() || undefined,
      description: e.currentTarget.description.value,
      maintainers: convertToNameAndUrl(maintainers),
      dataProvenance: convertToNameAndUrl(dataProvenances),
      legendPlacements: updatedLegendPlacements,
    }, true, false));

    dismissModal();
  }


  return (
    <DatasetEditorForm ref={formRef} onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-sm-6">
          <div className="row">
            <div className="col-lg-6">
              <label>
                {t("Dataset title")}:<br/>
                <input
                  name="datasetTitle"
                  type="text"
                  defaultValue={metadata.title || ""} />
              </label>
            </div>
            <div className="col-lg-6">
              <label>
                {t("Date updated")}:<br/>
                <input
                  name="updated"
                  type="date"
                  defaultValue={metadata.updated || ""}/>
              </label>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <label>
                {t("Build URL")}:<br/>
                <input
                  name="buildUrl"
                  type="url"
                  defaultValue={metadata.buildUrl || ""}/>
              </label>
            </div>
            <div className="col-lg-6">
              <label>
                {t("Avatar URL")}:<br/>
                <input
                  name="avatarUrl"
                  type="url"
                  defaultValue={metadata.buildAvatar || ""}/>
              </label>
            </div>
          </div>
          <NameAndUrlInputs
            name="maintainers"
            data={maintainers}
            setData={setMaintainers}
          />
          <NameAndUrlInputs
            name="data provenances"
            data={dataProvenances}
            setData={setDataProvenances}
          />
        </div>
        <div className="col-sm-6">
          <label>
            {t("Warning")}:<br/>
            <textarea
              name="warning"
              defaultValue={metadata.warning || ""}/>
          </label>
          <label>
            {t("Description")}:<br/>
            <textarea
              rows={10}
              name="description"
              defaultValue={metadata.description || ""}/>
          </label>
          <LegendPlacementInputs
            defaultPlacements={metadata.legendPlacements}
          />
        </div>
      </div>
      <Flex justifyContent="center">
        <button type="submit" style={{ margin: 10 }}>
          {t("Apply changes")}
        </button>
        <button type="button" style={{ margin: 10 }} onClick={dismissModal}>
          {t("Discard changes")}
        </button>
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
    s.height = browserDimensions.height - 200;
    s.maxHeight = s.height;
    s.padding = "2em";
    s.color = "#1f2328";
    s.backgroundColor = "#ffffff";
    return s
  }
};


function NameAndUrlInputs({
  name,
  data,
  setData,
}: {
  name: string,
  data: NameAndUrlState[],
  setData: Dispatch<NameAndUrlState[]>
}): JSX.Element {
  const { t } = useTranslation();
  // Track id with ref to avoid using array idx for unique id
  const nextId = useRef(data.length);

  function addNameAndUrl(): void {
    const newItem: NameAndUrlState = {
      id: nextId.current,
      name: "",
      url: "",
    }
    nextId.current++;
    setData([...data, newItem]);
  }

  function changeNameAndUrl(newItem: NameAndUrlState): void {
    setData(
      [...data].map((item) => {
        if (item.id === newItem.id) return newItem;
        return item
      })
    );
  }

  function deleteNameAndUrl(id: number): void {
    setData(
      [...data].filter((item) => item.id !== id)
    );
  }

  return (
    <>
      <div className="row">
        <div className="col-xs-12 underlined">
          {t(name)}:
        </div>
      </div>
      {data.map((item) =>
        <Flex key={item.id}>
          <div className="col-xs-6">
            <label>
              {t("Name")}:<br/>
              <input
                required
                type="text"
                value={item.name}
                onChange={(e): void => changeNameAndUrl({ ...item, name: e.currentTarget.value })}
              />
            </label>
          </div>
          <div className="col-xs-5">
            <label>
              {t("URL")}:<br/>
              <input
                type="url"
                value={item.url}
                onChange={(e): void => changeNameAndUrl({ ...item, url: e.currentTarget.value })}
              />
            </label>
          </div>
          <div className="col-xs-1">
            <button
              type="button"
              onClick={(): void => deleteNameAndUrl(item.id)}
            >
              <FaTrashAlt />
            </button>
          </div>
        </Flex>
      )}
      <Flex>
        <button
          type="button"
          onClick={addNameAndUrl}
        >
          {t(`Add ${name}`)}
        </button>
      </Flex>
    </>
  )
}

function reduxPlacementToInput(placement: LegendPlacement): string {
  return `${placement.vertical} ${placement.horizontal}`;
}

function inputPlacementToRedux(placement: string): LegendPlacement {
  const [ vertical, horizontal ] = placement.split(" ");
  assertValidVertical(vertical);
  assertValidHorizontal(horizontal);

  return {
    vertical,
    horizontal
  }
}

function assertValidVertical(vertical: string): asserts vertical is LegendPlacement["vertical"] {
  switch (vertical) {
    case "top":
    case "bottom":
      return;
    default:
      throw new Error(`Invalid vertical string ${vertical}`);
  }
}

function assertValidHorizontal(horizontal: string): asserts horizontal is LegendPlacement["horizontal"] {
  switch (horizontal) {
    case "left":
    case "right":
      return;
    default:
      throw new Error(`Invalid horizontal string ${horizontal}`);
  }
}


function LegendPlacementInputs({
  defaultPlacements,
}: {
  defaultPlacements: Metadata["legendPlacements"]
}): JSX.Element {
  const { t } = useTranslation();
  const legendPlacements = ["top left", "top right", "bottom left", "bottom right"];
  const panelDefaults = Object.fromEntries(
    Object.entries(defaultPlacements).map(
      ([panel, legendPlacement]) => [panel, reduxPlacementToInput(legendPlacement)]
    )
  );

  return (
    <>
      <div className="underlined">
        {t("Legend placement")}
      </div>
      <Flex justifyContent="space-around">
        {Object.keys(panelDefaults).map((panel) => (
          <div key={panel}>
            {t(`${panel} panel`)}
            {legendPlacements.map((placement) => (
            <Flex
              key={placement}
              justifyContent="flex-start"
              alignContent="center"
              style={{ margin: "0.25em 1em" }}
            >
              <input
                id={`${panel}-${placement}`}
                name={`${panel}Legend`}
                type="radio"
                value={placement}
                defaultChecked={panelDefaults[panel] === placement}
              />
              <label htmlFor={`${panel}-${placement}`}>
                {t(placement)}
              </label>
            </Flex>
            ))}
          </div>
        ))}
      </Flex>
    </>
  )
}

export function enableDatasetEditor(): boolean {
  if (!hasExtension("enableDatasetEditor") || !getExtension("enableDatasetEditor")) {
    return false;
  }
  return true;
}
