import Mousetrap from "mousetrap";
import store from "../store"

const shortcutsRegistered: Set<string> = new Set();

export function registerKeyboardShortcut(keys:string|string[], callback):void {
  const keysList = normalise(keys)
    .filter((k) => {
      if (shortcutsRegistered.has(k)) {
        console.error(`Attempted to register a keydown for '${k}' but it has already been registered. Ignoring.`);
        return false;
      }
      shortcutsRegistered.add(k);
      return true;
    });
  
  if (!keysList.length) return;
  
  Mousetrap.bind(keysList, (e, combo) => callback(e, combo, store.dispatch), 'keydown');
}

export function unregisterKeyboardShortcut(keys:string|string[]):void {
  const keysList = normalise(keys)
    .forEach((k) => shortcutsRegistered.delete(k));

  Mousetrap.unbind(keysList, 'keydown');
}


function normalise(combos:string|string[]): string[] {
  return (Array.isArray(combos) ? combos : [combos])
    .map((s) => s.toLowerCase())
}
