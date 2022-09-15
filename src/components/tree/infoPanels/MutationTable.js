import React from "react";
import styled from 'styled-components';
import { FaInfoCircle } from "react-icons/fa";
import { getBranchMutations, getTipChanges } from "../../../util/treeMiscHelpers";
import { StyledTooltip } from "../../controls/styles";

const Button = styled.button`
  border: 0px;
  background-color: inherit;
  cursor: pointer;
  outline: 0;
  text-decoration: underline;
  font-size: 16px;
  padding: 0px 0px;
`;

const mutSortFn = (a, b) => {
  const [aa, bb] = [parseInt(a.slice(1, -1), 10), parseInt(b.slice(1, -1), 10)];
  return aa<bb ? -1 : 1;
};

/**
 * Given a list of Ns or gaps, group them into runs of Ns
 * Returns a list of objects with properties `start` and `end` (both 1-based and
 * both are either a gap or an N), as well as `count` (number of Ns or gaps).
 * @param {mutationString[]} muts
 * @returns {intervalObject[]}
 */
export const parseIntervalsOfNsOrGaps = (muts) => {
  const runs = [];
  muts.sort(mutSortFn).forEach((m, idx) => {
    const pos = parseInt(m.slice(1, -1), 10);
    if (idx===0 || pos!==runs[runs.length-1].end+1) {
      runs.push({start: pos, end: pos, count: 1, char: m.slice(-1)});
    } else {
      runs[runs.length-1].end = pos;
      runs[runs.length-1].count+=1;
    }
  });
  return runs;
};

const Heading = styled.p`
  margin-top: 12px;
  margin-bottom: 4px;
`;
const SubHeading = styled.span`
  padding-right: 8px;
`;
const MutationList = styled.span`
`;
const MutationLine = styled.p`
  margin: 0px 0px 4px 0px;
  font-weight: 300;
  font-size: 16px;
`;
const TableFirstColumn = styled.td`
  font-weight: 500;
  white-space: nowrap;
  vertical-align: baseline;
`;
const ListOfMutations = ({name, muts, displayAsIntervals, isNuc}) => {
  let mutString, title;
  if (displayAsIntervals) {
    const intervals = parseIntervalsOfNsOrGaps(muts);
    title = `${name} (${intervals.length} regions, ${muts.length}${isNuc?'bp':' codons'}):`;
    mutString = intervals.map((interval) =>
      interval.count===1 ?
        `${interval.start}` :
        `${interval.start}..${interval.end} (${interval.count} ${isNuc?'bp':'codons'})`
    ).join(", ");
  } else {
    title = `${name} (${muts.length}):`;
    mutString = muts.sort(mutSortFn).join(", ");
  }
  return (
    <MutationLine>
      <SubHeading key={name}>{title}</SubHeading>
      <MutationList>{mutString}</MutationList>
    </MutationLine>
  );
};

const mutCategoryLookup = {
  unique: "Unique",
  changes: "Changes",
  homoplasies: "Homoplasies",
  reversionsToRoot: "Reversions to root",
  undeletions: "Undeletions",
  gaps: "Gaps",
  ns: "Ns "
};

/**
 * Returns a TSV-style string of all mutations / changes
 */
const mutationsToTsv = (categorisedMutations, geneSortFn) =>
  Object.keys(categorisedMutations).sort(geneSortFn).map((gene) =>
    Object.keys(mutCategoryLookup)
      .filter((key) => (key in categorisedMutations[gene] && categorisedMutations[gene][key].length))
      .map((key) =>
        `${gene}\t${key}\t${categorisedMutations[gene][key].sort(mutSortFn).join(", ")}`
      )
  ).flat()
  .join("\n");

/**
 * Returns a table row element for the (categorised) mutations for the given gene
 * @returns {(ReactComponent|null)}
 */
const displayGeneMutations = (gene, mutsPerCat) => {
  /* check if any categories have entries for us to display */
  if (Object.values(mutsPerCat).filter((lst) => lst.length).length === 0) {
    return null;
  }
  return (
    <tr key={gene}>
      <TableFirstColumn>{gene==="nuc" ? "Nt" : gene}</TableFirstColumn>
      <td>
        {Object.entries(mutCategoryLookup).map(([key, name]) => (
          (key in mutsPerCat && mutsPerCat[key].length) ?
            (<ListOfMutations
              key={name}
              name={name}
              muts={mutsPerCat[key]}
              displayAsIntervals={key==="gaps" || key==="ns" || key==='undeletions'}
              isNuc={gene==="nuc"}
            />) :
            null
        ))}
      </td>
    </tr>
  );
};

const InfoContainer = styled.span`
  padding-left: 10px;
  cursor: help;
  color: #888;
`;

const branchMutationInfo = (<div>
  A summary of mutations inferred to have occurred on this branch.
  Mutations are grouped into one of the following (mutually exclusive) categories,
  with the first matching category used:

  <ol>
    <li>Undeletions: a change from a &apos;-&apos; character to a base; beware that these are often bioinformatics artifacts</li>
    <li>Gaps: A change to a &apos;-&apos; character, indicating a missing base; these can indicate deletions but sometimes areas of no coverage are filled with gaps</li>
    <li>Ns: Typically due to lack of sequence coverage or ambiguity at this position (Nucleotides only)</li>
    <li>Homoplasies: a mutation that has also been observed elsewhere on the tree</li>
    <li>Unique: Mutations which are only observed on this branch</li>
  </ol>

  Reversions to Root is an additional category which highlights those mutations which return the state to that of the root.
  Mutations in this category will also appear one of the five categories listed above.
  <p/>
  Gaps and Ns are grouped into intervals, as they frequently occur in succession.
  Click below to copy all changes to clipboard to see the full list.
</div>);

const tipChangesInfo = (<div>
  A summary of sequence changes between the root and the selected tip.
  Changes are grouped into one of the following (mutually exclusive) categories,
  with the first matching category used:

  <ol>
    <li>Gaps: A change to a &apos;-&apos; character, indicating a missing base; these can indicate deletions but sometimes areas of no coverage are filled with gaps</li>
    <li>Ns: Typically due to lack of sequence coverage or ambiguity at this position (Nucleotides only)</li>
    <li>Reversions to root: The tip state is the same as the root state, however this has changed and been reverted along the way</li>
    <li>Changes: The tip state differs from the root state</li>
  </ol>

  Gaps and Ns are grouped into intervals, as they frequently occur in succession.
  Click below to copy all changes to clipboard to see the full list.
</div>);


export const MutationTable = ({node, geneSortFn, isTip, observedMutations}) => {
  const categorisedMutations = isTip ?
    getTipChanges(node) :
    getBranchMutations(node, observedMutations);

  if (Object.keys(categorisedMutations).length===0) {
    return (
      <Heading>
        {isTip ? `No sequence changes observed` : `No mutations observed on branch`}
      </Heading>
    );
  }

  return (
    <>
      <Heading>
        {isTip ? `Sequence changes observed (from root)` : `Mutations observed on branch`}
        <InfoContainer data-tip data-for="seqChangesInfo">
          <FaInfoCircle/>
        </InfoContainer>
      </Heading>

      <StyledTooltip place="bottom" type="light" effect="solid" id="seqChangesInfo">
        {isTip ? tipChangesInfo : branchMutationInfo}
      </StyledTooltip>

      <table>
        <tbody>
          {Object.keys(categorisedMutations).sort(geneSortFn).map(
            (gene) => displayGeneMutations(gene, categorisedMutations[gene], isTip)
          )}
          <tr>
            <td/>
            <td>
              <Button onClick={() => {navigator.clipboard.writeText(mutationsToTsv(categorisedMutations, geneSortFn));}}>
                {`Click to copy all ${isTip ? 'changes' : 'mutations'} to clipboard as TSV`}
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};
