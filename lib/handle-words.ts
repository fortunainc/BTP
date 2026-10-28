import { randomInt } from 'node:crypto';

// Neutral nature words so a handle never hints at a name, employer, site or role.
const FIRST = ['amber', 'quiet', 'north', 'silver', 'cedar', 'misty', 'golden', 'still', 'harbor', 'linen', 'copper', 'river',
  'autumn', 'winter', 'meadow', 'ember', 'stone', 'willow', 'coastal', 'velvet', 'hollow', 'gentle', 'bright', 'steady',
  'iron', 'pine', 'cobalt', 'sable', 'dune', 'frost', 'russet', 'slate', 'ivory', 'moss', 'clear', 'distant', 'calm', 'wild'];
const SECOND = ['reed', 'tide', 'birch', 'heron', 'brook', 'ridge', 'lark', 'fern', 'harbor', 'maple', 'finch', 'grove',
  'cove', 'wren', 'aspen', 'field', 'crest', 'marsh', 'pebble', 'spruce', 'delta', 'thistle', 'orchard', 'sparrow',
  'canyon', 'island', 'glade', 'falcon', 'meadow', 'harrow', 'lantern', 'compass', 'cairn', 'larch', 'tern', 'quill'];

const pick = (list: string[]) => list[randomInt(list.length)];

/** A random two-word handle such as "amber-reed"; a short number is added when `withSuffix` is set. */
export function generateHandle(withSuffix = false): string {
  let first = pick(FIRST);
  let second = pick(SECOND);
  while (second === first) second = pick(SECOND);
  return withSuffix ? `${first}-${second}-${randomInt(10, 100)}` : `${first}-${second}`;
}

/** Placeholder handles created at first sign-in, before the member picks one. */
export function isPlaceholderHandle(handle: string | null | undefined): boolean {
  return !handle || /^member-[0-9a-f]{6}$/.test(handle);
}
