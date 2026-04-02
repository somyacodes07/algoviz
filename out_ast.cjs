var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/web-tree-sitter/web-tree-sitter.js
var import_meta = {};
var __defProp2 = Object.defineProperty;
var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
var Edit = class {
  static {
    __name(this, "Edit");
  }
  /** The start position of the change. */
  startPosition;
  /** The end position of the change before the edit. */
  oldEndPosition;
  /** The end position of the change after the edit. */
  newEndPosition;
  /** The start index of the change. */
  startIndex;
  /** The end index of the change before the edit. */
  oldEndIndex;
  /** The end index of the change after the edit. */
  newEndIndex;
  constructor({
    startIndex,
    oldEndIndex,
    newEndIndex,
    startPosition,
    oldEndPosition,
    newEndPosition
  }) {
    this.startIndex = startIndex >>> 0;
    this.oldEndIndex = oldEndIndex >>> 0;
    this.newEndIndex = newEndIndex >>> 0;
    this.startPosition = startPosition;
    this.oldEndPosition = oldEndPosition;
    this.newEndPosition = newEndPosition;
  }
  /**
   * Edit a point and index to keep it in-sync with source code that has been edited.
   *
   * This function updates a single point's byte offset and row/column position
   * based on an edit operation. This is useful for editing points without
   * requiring a tree or node instance.
   */
  editPoint(point, index) {
    let newIndex = index;
    const newPoint = { ...point };
    if (index >= this.oldEndIndex) {
      newIndex = this.newEndIndex + (index - this.oldEndIndex);
      const originalRow = point.row;
      newPoint.row = this.newEndPosition.row + (point.row - this.oldEndPosition.row);
      newPoint.column = originalRow === this.oldEndPosition.row ? this.newEndPosition.column + (point.column - this.oldEndPosition.column) : point.column;
    } else if (index > this.startIndex) {
      newIndex = this.newEndIndex;
      newPoint.row = this.newEndPosition.row;
      newPoint.column = this.newEndPosition.column;
    }
    return { point: newPoint, index: newIndex };
  }
  /**
   * Edit a range to keep it in-sync with source code that has been edited.
   *
   * This function updates a range's start and end positions based on an edit
   * operation. This is useful for editing ranges without requiring a tree
   * or node instance.
   */
  editRange(range) {
    const newRange = {
      startIndex: range.startIndex,
      startPosition: { ...range.startPosition },
      endIndex: range.endIndex,
      endPosition: { ...range.endPosition }
    };
    if (range.endIndex >= this.oldEndIndex) {
      if (range.endIndex !== Number.MAX_SAFE_INTEGER) {
        newRange.endIndex = this.newEndIndex + (range.endIndex - this.oldEndIndex);
        newRange.endPosition = {
          row: this.newEndPosition.row + (range.endPosition.row - this.oldEndPosition.row),
          column: range.endPosition.row === this.oldEndPosition.row ? this.newEndPosition.column + (range.endPosition.column - this.oldEndPosition.column) : range.endPosition.column
        };
        if (newRange.endIndex < this.newEndIndex) {
          newRange.endIndex = Number.MAX_SAFE_INTEGER;
          newRange.endPosition = { row: Number.MAX_SAFE_INTEGER, column: Number.MAX_SAFE_INTEGER };
        }
      }
    } else if (range.endIndex > this.startIndex) {
      newRange.endIndex = this.startIndex;
      newRange.endPosition = { ...this.startPosition };
    }
    if (range.startIndex >= this.oldEndIndex) {
      newRange.startIndex = this.newEndIndex + (range.startIndex - this.oldEndIndex);
      newRange.startPosition = {
        row: this.newEndPosition.row + (range.startPosition.row - this.oldEndPosition.row),
        column: range.startPosition.row === this.oldEndPosition.row ? this.newEndPosition.column + (range.startPosition.column - this.oldEndPosition.column) : range.startPosition.column
      };
      if (newRange.startIndex < this.newEndIndex) {
        newRange.startIndex = Number.MAX_SAFE_INTEGER;
        newRange.startPosition = { row: Number.MAX_SAFE_INTEGER, column: Number.MAX_SAFE_INTEGER };
      }
    } else if (range.startIndex > this.startIndex) {
      newRange.startIndex = this.startIndex;
      newRange.startPosition = { ...this.startPosition };
    }
    return newRange;
  }
};
var SIZE_OF_SHORT = 2;
var SIZE_OF_INT = 4;
var SIZE_OF_CURSOR = 4 * SIZE_OF_INT;
var SIZE_OF_NODE = 5 * SIZE_OF_INT;
var SIZE_OF_POINT = 2 * SIZE_OF_INT;
var SIZE_OF_RANGE = 2 * SIZE_OF_INT + 2 * SIZE_OF_POINT;
var ZERO_POINT = { row: 0, column: 0 };
var INTERNAL = /* @__PURE__ */ Symbol("INTERNAL");
function assertInternal(x) {
  if (x !== INTERNAL) throw new Error("Illegal constructor");
}
__name(assertInternal, "assertInternal");
function isPoint(point) {
  return !!point && typeof point.row === "number" && typeof point.column === "number";
}
__name(isPoint, "isPoint");
function setModule(module2) {
  C = module2;
}
__name(setModule, "setModule");
var C;
var LookaheadIterator = class {
  static {
    __name(this, "LookaheadIterator");
  }
  /** @internal */
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  language;
  /** @internal */
  constructor(internal, address, language) {
    assertInternal(internal);
    this[0] = address;
    this.language = language;
  }
  /** Get the current symbol of the lookahead iterator. */
  get currentTypeId() {
    return C._ts_lookahead_iterator_current_symbol(this[0]);
  }
  /** Get the current symbol name of the lookahead iterator. */
  get currentType() {
    return this.language.types[this.currentTypeId] || "ERROR";
  }
  /** Delete the lookahead iterator, freeing its resources. */
  delete() {
    C._ts_lookahead_iterator_delete(this[0]);
    this[0] = 0;
  }
  /**
   * Reset the lookahead iterator.
   *
   * This returns `true` if the language was set successfully and `false`
   * otherwise.
   */
  reset(language, stateId) {
    if (C._ts_lookahead_iterator_reset(this[0], language[0], stateId)) {
      this.language = language;
      return true;
    }
    return false;
  }
  /**
   * Reset the lookahead iterator to another state.
   *
   * This returns `true` if the iterator was reset to the given state and
   * `false` otherwise.
   */
  resetState(stateId) {
    return Boolean(C._ts_lookahead_iterator_reset_state(this[0], stateId));
  }
  /**
   * Returns an iterator that iterates over the symbols of the lookahead iterator.
   *
   * The iterator will yield the current symbol name as a string for each step
   * until there are no more symbols to iterate over.
   */
  [Symbol.iterator]() {
    return {
      next: /* @__PURE__ */ __name(() => {
        if (C._ts_lookahead_iterator_next(this[0])) {
          return { done: false, value: this.currentType };
        }
        return { done: true, value: "" };
      }, "next")
    };
  }
};
function getText(tree, startIndex, endIndex, startPosition) {
  const length = endIndex - startIndex;
  let result = tree.textCallback(startIndex, startPosition);
  if (result) {
    startIndex += result.length;
    while (startIndex < endIndex) {
      const string = tree.textCallback(startIndex, startPosition);
      if (string && string.length > 0) {
        startIndex += string.length;
        result += string;
      } else {
        break;
      }
    }
    if (startIndex > endIndex) {
      result = result.slice(0, length);
    }
  }
  return result ?? "";
}
__name(getText, "getText");
var Tree = class _Tree {
  static {
    __name(this, "Tree");
  }
  /** @internal */
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  textCallback;
  /** The language that was used to parse the syntax tree. */
  language;
  /** @internal */
  constructor(internal, address, language, textCallback) {
    assertInternal(internal);
    this[0] = address;
    this.language = language;
    this.textCallback = textCallback;
  }
  /** Create a shallow copy of the syntax tree. This is very fast. */
  copy() {
    const address = C._ts_tree_copy(this[0]);
    return new _Tree(INTERNAL, address, this.language, this.textCallback);
  }
  /** Delete the syntax tree, freeing its resources. */
  delete() {
    C._ts_tree_delete(this[0]);
    this[0] = 0;
  }
  /** Get the root node of the syntax tree. */
  get rootNode() {
    C._ts_tree_root_node_wasm(this[0]);
    return unmarshalNode(this);
  }
  /**
   * Get the root node of the syntax tree, but with its position shifted
   * forward by the given offset.
   */
  rootNodeWithOffset(offsetBytes, offsetExtent) {
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    C.setValue(address, offsetBytes, "i32");
    marshalPoint(address + SIZE_OF_INT, offsetExtent);
    C._ts_tree_root_node_with_offset_wasm(this[0]);
    return unmarshalNode(this);
  }
  /**
   * Edit the syntax tree to keep it in sync with source code that has been
   * edited.
   *
   * You must describe the edit both in terms of byte offsets and in terms of
   * row/column coordinates.
   */
  edit(edit) {
    marshalEdit(edit);
    C._ts_tree_edit_wasm(this[0]);
  }
  /** Create a new {@link TreeCursor} starting from the root of the tree. */
  walk() {
    return this.rootNode.walk();
  }
  /**
   * Compare this old edited syntax tree to a new syntax tree representing
   * the same document, returning a sequence of ranges whose syntactic
   * structure has changed.
   *
   * For this to work correctly, this syntax tree must have been edited such
   * that its ranges match up to the new tree. Generally, you'll want to
   * call this method right after calling one of the [`Parser::parse`]
   * functions. Call it on the old tree that was passed to parse, and
   * pass the new tree that was returned from `parse`.
   */
  getChangedRanges(other) {
    if (!(other instanceof _Tree)) {
      throw new TypeError("Argument must be a Tree");
    }
    C._ts_tree_get_changed_ranges_wasm(this[0], other[0]);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = unmarshalRange(address);
        address += SIZE_OF_RANGE;
      }
      C._free(buffer);
    }
    return result;
  }
  /** Get the included ranges that were used to parse the syntax tree. */
  getIncludedRanges() {
    C._ts_tree_included_ranges_wasm(this[0]);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = unmarshalRange(address);
        address += SIZE_OF_RANGE;
      }
      C._free(buffer);
    }
    return result;
  }
};
var TreeCursor = class _TreeCursor {
  static {
    __name(this, "TreeCursor");
  }
  /** @internal */
  // @ts-expect-error: never read
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  // @ts-expect-error: never read
  [1] = 0;
  // Internal handle for Wasm
  /** @internal */
  // @ts-expect-error: never read
  [2] = 0;
  // Internal handle for Wasm
  /** @internal */
  // @ts-expect-error: never read
  [3] = 0;
  // Internal handle for Wasm
  /** @internal */
  tree;
  /** @internal */
  constructor(internal, tree) {
    assertInternal(internal);
    this.tree = tree;
    unmarshalTreeCursor(this);
  }
  /** Creates a deep copy of the tree cursor. This allocates new memory. */
  copy() {
    const copy = new _TreeCursor(INTERNAL, this.tree);
    C._ts_tree_cursor_copy_wasm(this.tree[0]);
    unmarshalTreeCursor(copy);
    return copy;
  }
  /** Delete the tree cursor, freeing its resources. */
  delete() {
    marshalTreeCursor(this);
    C._ts_tree_cursor_delete_wasm(this.tree[0]);
    this[0] = this[1] = this[2] = 0;
  }
  /** Get the tree cursor's current {@link Node}. */
  get currentNode() {
    marshalTreeCursor(this);
    C._ts_tree_cursor_current_node_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /**
   * Get the numerical field id of this tree cursor's current node.
   *
   * See also {@link TreeCursor#currentFieldName}.
   */
  get currentFieldId() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_field_id_wasm(this.tree[0]);
  }
  /** Get the field name of this tree cursor's current node. */
  get currentFieldName() {
    return this.tree.language.fields[this.currentFieldId];
  }
  /**
   * Get the depth of the cursor's current node relative to the original
   * node that the cursor was constructed with.
   */
  get currentDepth() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_depth_wasm(this.tree[0]);
  }
  /**
   * Get the index of the cursor's current node out of all of the
   * descendants of the original node that the cursor was constructed with.
   */
  get currentDescendantIndex() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_descendant_index_wasm(this.tree[0]);
  }
  /** Get the type of the cursor's current node. */
  get nodeType() {
    return this.tree.language.types[this.nodeTypeId] || "ERROR";
  }
  /** Get the type id of the cursor's current node. */
  get nodeTypeId() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_node_type_id_wasm(this.tree[0]);
  }
  /** Get the state id of the cursor's current node. */
  get nodeStateId() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_node_state_id_wasm(this.tree[0]);
  }
  /** Get the id of the cursor's current node. */
  get nodeId() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_node_id_wasm(this.tree[0]);
  }
  /**
   * Check if the cursor's current node is *named*.
   *
   * Named nodes correspond to named rules in the grammar, whereas
   * *anonymous* nodes correspond to string literals in the grammar.
   */
  get nodeIsNamed() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_node_is_named_wasm(this.tree[0]) === 1;
  }
  /**
   * Check if the cursor's current node is *missing*.
   *
   * Missing nodes are inserted by the parser in order to recover from
   * certain kinds of syntax errors.
   */
  get nodeIsMissing() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_current_node_is_missing_wasm(this.tree[0]) === 1;
  }
  /** Get the string content of the cursor's current node. */
  get nodeText() {
    marshalTreeCursor(this);
    const startIndex = C._ts_tree_cursor_start_index_wasm(this.tree[0]);
    const endIndex = C._ts_tree_cursor_end_index_wasm(this.tree[0]);
    C._ts_tree_cursor_start_position_wasm(this.tree[0]);
    const startPosition = unmarshalPoint(TRANSFER_BUFFER);
    return getText(this.tree, startIndex, endIndex, startPosition);
  }
  /** Get the start position of the cursor's current node. */
  get startPosition() {
    marshalTreeCursor(this);
    C._ts_tree_cursor_start_position_wasm(this.tree[0]);
    return unmarshalPoint(TRANSFER_BUFFER);
  }
  /** Get the end position of the cursor's current node. */
  get endPosition() {
    marshalTreeCursor(this);
    C._ts_tree_cursor_end_position_wasm(this.tree[0]);
    return unmarshalPoint(TRANSFER_BUFFER);
  }
  /** Get the start index of the cursor's current node. */
  get startIndex() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_start_index_wasm(this.tree[0]);
  }
  /** Get the end index of the cursor's current node. */
  get endIndex() {
    marshalTreeCursor(this);
    return C._ts_tree_cursor_end_index_wasm(this.tree[0]);
  }
  /**
   * Move this cursor to the first child of its current node.
   *
   * This returns `true` if the cursor successfully moved, and returns
   * `false` if there were no children.
   */
  gotoFirstChild() {
    marshalTreeCursor(this);
    const result = C._ts_tree_cursor_goto_first_child_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move this cursor to the last child of its current node.
   *
   * This returns `true` if the cursor successfully moved, and returns
   * `false` if there were no children.
   *
   * Note that this function may be slower than
   * {@link TreeCursor#gotoFirstChild} because it needs to
   * iterate through all the children to compute the child's position.
   */
  gotoLastChild() {
    marshalTreeCursor(this);
    const result = C._ts_tree_cursor_goto_last_child_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move this cursor to the parent of its current node.
   *
   * This returns `true` if the cursor successfully moved, and returns
   * `false` if there was no parent node (the cursor was already on the
   * root node).
   *
   * Note that the node the cursor was constructed with is considered the root
   * of the cursor, and the cursor cannot walk outside this node.
   */
  gotoParent() {
    marshalTreeCursor(this);
    const result = C._ts_tree_cursor_goto_parent_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move this cursor to the next sibling of its current node.
   *
   * This returns `true` if the cursor successfully moved, and returns
   * `false` if there was no next sibling node.
   *
   * Note that the node the cursor was constructed with is considered the root
   * of the cursor, and the cursor cannot walk outside this node.
   */
  gotoNextSibling() {
    marshalTreeCursor(this);
    const result = C._ts_tree_cursor_goto_next_sibling_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move this cursor to the previous sibling of its current node.
   *
   * This returns `true` if the cursor successfully moved, and returns
   * `false` if there was no previous sibling node.
   *
   * Note that this function may be slower than
   * {@link TreeCursor#gotoNextSibling} due to how node
   * positions are stored. In the worst case, this will need to iterate
   * through all the children up to the previous sibling node to recalculate
   * its position. Also note that the node the cursor was constructed with is
   * considered the root of the cursor, and the cursor cannot walk outside this node.
   */
  gotoPreviousSibling() {
    marshalTreeCursor(this);
    const result = C._ts_tree_cursor_goto_previous_sibling_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move the cursor to the node that is the nth descendant of
   * the original node that the cursor was constructed with, where
   * zero represents the original node itself.
   */
  gotoDescendant(goalDescendantIndex) {
    marshalTreeCursor(this);
    C._ts_tree_cursor_goto_descendant_wasm(this.tree[0], goalDescendantIndex);
    unmarshalTreeCursor(this);
  }
  /**
   * Move this cursor to the first child of its current node that contains or
   * starts after the given byte offset.
   *
   * This returns `true` if the cursor successfully moved to a child node, and returns
   * `false` if no such child was found.
   */
  gotoFirstChildForIndex(goalIndex) {
    marshalTreeCursor(this);
    C.setValue(TRANSFER_BUFFER + SIZE_OF_CURSOR, goalIndex, "i32");
    const result = C._ts_tree_cursor_goto_first_child_for_index_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Move this cursor to the first child of its current node that contains or
   * starts after the given byte offset.
   *
   * This returns the index of the child node if one was found, and returns
   * `null` if no such child was found.
   */
  gotoFirstChildForPosition(goalPosition) {
    marshalTreeCursor(this);
    marshalPoint(TRANSFER_BUFFER + SIZE_OF_CURSOR, goalPosition);
    const result = C._ts_tree_cursor_goto_first_child_for_position_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
    return result === 1;
  }
  /**
   * Re-initialize this tree cursor to start at the original node that the
   * cursor was constructed with.
   */
  reset(node) {
    marshalNode(node);
    marshalTreeCursor(this, TRANSFER_BUFFER + SIZE_OF_NODE);
    C._ts_tree_cursor_reset_wasm(this.tree[0]);
    unmarshalTreeCursor(this);
  }
  /**
   * Re-initialize a tree cursor to the same position as another cursor.
   *
   * Unlike {@link TreeCursor#reset}, this will not lose parent
   * information and allows reusing already created cursors.
   */
  resetTo(cursor) {
    marshalTreeCursor(this, TRANSFER_BUFFER);
    marshalTreeCursor(cursor, TRANSFER_BUFFER + SIZE_OF_CURSOR);
    C._ts_tree_cursor_reset_to_wasm(this.tree[0], cursor.tree[0]);
    unmarshalTreeCursor(this);
  }
};
var Node = class {
  static {
    __name(this, "Node");
  }
  /** @internal */
  // @ts-expect-error: never read
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  _children;
  /** @internal */
  _namedChildren;
  /** @internal */
  constructor(internal, {
    id,
    tree,
    startIndex,
    startPosition,
    other
  }) {
    assertInternal(internal);
    this[0] = other;
    this.id = id;
    this.tree = tree;
    this.startIndex = startIndex;
    this.startPosition = startPosition;
  }
  /**
   * The numeric id for this node that is unique.
   *
   * Within a given syntax tree, no two nodes have the same id. However:
   *
   * * If a new tree is created based on an older tree, and a node from the old tree is reused in
   *   the process, then that node will have the same id in both trees.
   *
   * * A node not marked as having changes does not guarantee it was reused.
   *
   * * If a node is marked as having changed in the old tree, it will not be reused.
   */
  id;
  /** The byte index where this node starts. */
  startIndex;
  /** The position where this node starts. */
  startPosition;
  /** The tree that this node belongs to. */
  tree;
  /** Get this node's type as a numerical id. */
  get typeId() {
    marshalNode(this);
    return C._ts_node_symbol_wasm(this.tree[0]);
  }
  /**
   * Get the node's type as a numerical id as it appears in the grammar,
   * ignoring aliases.
   */
  get grammarId() {
    marshalNode(this);
    return C._ts_node_grammar_symbol_wasm(this.tree[0]);
  }
  /** Get this node's type as a string. */
  get type() {
    return this.tree.language.types[this.typeId] || "ERROR";
  }
  /**
   * Get this node's symbol name as it appears in the grammar, ignoring
   * aliases as a string.
   */
  get grammarType() {
    return this.tree.language.types[this.grammarId] || "ERROR";
  }
  /**
   * Check if this node is *named*.
   *
   * Named nodes correspond to named rules in the grammar, whereas
   * *anonymous* nodes correspond to string literals in the grammar.
   */
  get isNamed() {
    marshalNode(this);
    return C._ts_node_is_named_wasm(this.tree[0]) === 1;
  }
  /**
   * Check if this node is *extra*.
   *
   * Extra nodes represent things like comments, which are not required
   * by the grammar, but can appear anywhere.
   */
  get isExtra() {
    marshalNode(this);
    return C._ts_node_is_extra_wasm(this.tree[0]) === 1;
  }
  /**
   * Check if this node represents a syntax error.
   *
   * Syntax errors represent parts of the code that could not be incorporated
   * into a valid syntax tree.
   */
  get isError() {
    marshalNode(this);
    return C._ts_node_is_error_wasm(this.tree[0]) === 1;
  }
  /**
   * Check if this node is *missing*.
   *
   * Missing nodes are inserted by the parser in order to recover from
   * certain kinds of syntax errors.
   */
  get isMissing() {
    marshalNode(this);
    return C._ts_node_is_missing_wasm(this.tree[0]) === 1;
  }
  /** Check if this node has been edited. */
  get hasChanges() {
    marshalNode(this);
    return C._ts_node_has_changes_wasm(this.tree[0]) === 1;
  }
  /**
   * Check if this node represents a syntax error or contains any syntax
   * errors anywhere within it.
   */
  get hasError() {
    marshalNode(this);
    return C._ts_node_has_error_wasm(this.tree[0]) === 1;
  }
  /** Get the byte index where this node ends. */
  get endIndex() {
    marshalNode(this);
    return C._ts_node_end_index_wasm(this.tree[0]);
  }
  /** Get the position where this node ends. */
  get endPosition() {
    marshalNode(this);
    C._ts_node_end_point_wasm(this.tree[0]);
    return unmarshalPoint(TRANSFER_BUFFER);
  }
  /** Get the string content of this node. */
  get text() {
    return getText(this.tree, this.startIndex, this.endIndex, this.startPosition);
  }
  /** Get this node's parse state. */
  get parseState() {
    marshalNode(this);
    return C._ts_node_parse_state_wasm(this.tree[0]);
  }
  /** Get the parse state after this node. */
  get nextParseState() {
    marshalNode(this);
    return C._ts_node_next_parse_state_wasm(this.tree[0]);
  }
  /** Check if this node is equal to another node. */
  equals(other) {
    return this.tree === other.tree && this.id === other.id;
  }
  /**
   * Get the node's child at the given index, where zero represents the first child.
   *
   * This method is fairly fast, but its cost is technically log(n), so if
   * you might be iterating over a long list of children, you should use
   * {@link Node#children} instead.
   */
  child(index) {
    marshalNode(this);
    C._ts_node_child_wasm(this.tree[0], index);
    return unmarshalNode(this.tree);
  }
  /**
   * Get this node's *named* child at the given index.
   *
   * See also {@link Node#isNamed}.
   * This method is fairly fast, but its cost is technically log(n), so if
   * you might be iterating over a long list of children, you should use
   * {@link Node#namedChildren} instead.
   */
  namedChild(index) {
    marshalNode(this);
    C._ts_node_named_child_wasm(this.tree[0], index);
    return unmarshalNode(this.tree);
  }
  /**
   * Get this node's child with the given numerical field id.
   *
   * See also {@link Node#childForFieldName}. You can
   * convert a field name to an id using {@link Language#fieldIdForName}.
   */
  childForFieldId(fieldId) {
    marshalNode(this);
    C._ts_node_child_by_field_id_wasm(this.tree[0], fieldId);
    return unmarshalNode(this.tree);
  }
  /**
   * Get the first child with the given field name.
   *
   * If multiple children may have the same field name, access them using
   * {@link Node#childrenForFieldName}.
   */
  childForFieldName(fieldName) {
    const fieldId = this.tree.language.fields.indexOf(fieldName);
    if (fieldId !== -1) return this.childForFieldId(fieldId);
    return null;
  }
  /** Get the field name of this node's child at the given index. */
  fieldNameForChild(index) {
    marshalNode(this);
    const address = C._ts_node_field_name_for_child_wasm(this.tree[0], index);
    if (!address) return null;
    return C.AsciiToString(address);
  }
  /** Get the field name of this node's named child at the given index. */
  fieldNameForNamedChild(index) {
    marshalNode(this);
    const address = C._ts_node_field_name_for_named_child_wasm(this.tree[0], index);
    if (!address) return null;
    return C.AsciiToString(address);
  }
  /**
   * Get an array of this node's children with a given field name.
   *
   * See also {@link Node#children}.
   */
  childrenForFieldName(fieldName) {
    const fieldId = this.tree.language.fields.indexOf(fieldName);
    if (fieldId !== -1 && fieldId !== 0) return this.childrenForFieldId(fieldId);
    return [];
  }
  /**
    * Get an array of this node's children with a given field id.
    *
    * See also {@link Node#childrenForFieldName}.
    */
  childrenForFieldId(fieldId) {
    marshalNode(this);
    C._ts_node_children_by_field_id_wasm(this.tree[0], fieldId);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = unmarshalNode(this.tree, address);
        address += SIZE_OF_NODE;
      }
      C._free(buffer);
    }
    return result;
  }
  /** Get the node's first child that contains or starts after the given byte offset. */
  firstChildForIndex(index) {
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    C.setValue(address, index, "i32");
    C._ts_node_first_child_for_byte_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the node's first named child that contains or starts after the given byte offset. */
  firstNamedChildForIndex(index) {
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    C.setValue(address, index, "i32");
    C._ts_node_first_named_child_for_byte_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get this node's number of children. */
  get childCount() {
    marshalNode(this);
    return C._ts_node_child_count_wasm(this.tree[0]);
  }
  /**
   * Get this node's number of *named* children.
   *
   * See also {@link Node#isNamed}.
   */
  get namedChildCount() {
    marshalNode(this);
    return C._ts_node_named_child_count_wasm(this.tree[0]);
  }
  /** Get this node's first child. */
  get firstChild() {
    return this.child(0);
  }
  /**
   * Get this node's first named child.
   *
   * See also {@link Node#isNamed}.
   */
  get firstNamedChild() {
    return this.namedChild(0);
  }
  /** Get this node's last child. */
  get lastChild() {
    return this.child(this.childCount - 1);
  }
  /**
   * Get this node's last named child.
   *
   * See also {@link Node#isNamed}.
   */
  get lastNamedChild() {
    return this.namedChild(this.namedChildCount - 1);
  }
  /**
   * Iterate over this node's children.
   *
   * If you're walking the tree recursively, you may want to use the
   * {@link TreeCursor} APIs directly instead.
   */
  get children() {
    if (!this._children) {
      marshalNode(this);
      C._ts_node_children_wasm(this.tree[0]);
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      this._children = new Array(count);
      if (count > 0) {
        let address = buffer;
        for (let i2 = 0; i2 < count; i2++) {
          this._children[i2] = unmarshalNode(this.tree, address);
          address += SIZE_OF_NODE;
        }
        C._free(buffer);
      }
    }
    return this._children;
  }
  /**
   * Iterate over this node's named children.
   *
   * See also {@link Node#children}.
   */
  get namedChildren() {
    if (!this._namedChildren) {
      marshalNode(this);
      C._ts_node_named_children_wasm(this.tree[0]);
      const count = C.getValue(TRANSFER_BUFFER, "i32");
      const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      this._namedChildren = new Array(count);
      if (count > 0) {
        let address = buffer;
        for (let i2 = 0; i2 < count; i2++) {
          this._namedChildren[i2] = unmarshalNode(this.tree, address);
          address += SIZE_OF_NODE;
        }
        C._free(buffer);
      }
    }
    return this._namedChildren;
  }
  /**
   * Get the descendants of this node that are the given type, or in the given types array.
   *
   * The types array should contain node type strings, which can be retrieved from {@link Language#types}.
   *
   * Additionally, a `startPosition` and `endPosition` can be passed in to restrict the search to a byte range.
   */
  descendantsOfType(types, startPosition = ZERO_POINT, endPosition = ZERO_POINT) {
    if (!Array.isArray(types)) types = [types];
    const symbols = [];
    const typesBySymbol = this.tree.language.types;
    for (const node_type of types) {
      if (node_type == "ERROR") {
        symbols.push(65535);
      }
    }
    for (let i2 = 0, n = typesBySymbol.length; i2 < n; i2++) {
      if (types.includes(typesBySymbol[i2])) {
        symbols.push(i2);
      }
    }
    const symbolsAddress = C._malloc(SIZE_OF_INT * symbols.length);
    for (let i2 = 0, n = symbols.length; i2 < n; i2++) {
      C.setValue(symbolsAddress + i2 * SIZE_OF_INT, symbols[i2], "i32");
    }
    marshalNode(this);
    C._ts_node_descendants_of_type_wasm(
      this.tree[0],
      symbolsAddress,
      symbols.length,
      startPosition.row,
      startPosition.column,
      endPosition.row,
      endPosition.column
    );
    const descendantCount = C.getValue(TRANSFER_BUFFER, "i32");
    const descendantAddress = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(descendantCount);
    if (descendantCount > 0) {
      let address = descendantAddress;
      for (let i2 = 0; i2 < descendantCount; i2++) {
        result[i2] = unmarshalNode(this.tree, address);
        address += SIZE_OF_NODE;
      }
    }
    C._free(descendantAddress);
    C._free(symbolsAddress);
    return result;
  }
  /** Get this node's next sibling. */
  get nextSibling() {
    marshalNode(this);
    C._ts_node_next_sibling_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get this node's previous sibling. */
  get previousSibling() {
    marshalNode(this);
    C._ts_node_prev_sibling_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /**
   * Get this node's next *named* sibling.
   *
   * See also {@link Node#isNamed}.
   */
  get nextNamedSibling() {
    marshalNode(this);
    C._ts_node_next_named_sibling_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /**
   * Get this node's previous *named* sibling.
   *
   * See also {@link Node#isNamed}.
   */
  get previousNamedSibling() {
    marshalNode(this);
    C._ts_node_prev_named_sibling_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the node's number of descendants, including one for the node itself. */
  get descendantCount() {
    marshalNode(this);
    return C._ts_node_descendant_count_wasm(this.tree[0]);
  }
  /**
   * Get this node's immediate parent.
   * Prefer {@link Node#childWithDescendant} for iterating over this node's ancestors.
   */
  get parent() {
    marshalNode(this);
    C._ts_node_parent_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /**
   * Get the node that contains `descendant`.
   *
   * Note that this can return `descendant` itself.
   */
  childWithDescendant(descendant) {
    marshalNode(this);
    marshalNode(descendant, 1);
    C._ts_node_child_with_descendant_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the smallest node within this node that spans the given byte range. */
  descendantForIndex(start2, end = start2) {
    if (typeof start2 !== "number" || typeof end !== "number") {
      throw new Error("Arguments must be numbers");
    }
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    C.setValue(address, start2, "i32");
    C.setValue(address + SIZE_OF_INT, end, "i32");
    C._ts_node_descendant_for_index_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the smallest named node within this node that spans the given byte range. */
  namedDescendantForIndex(start2, end = start2) {
    if (typeof start2 !== "number" || typeof end !== "number") {
      throw new Error("Arguments must be numbers");
    }
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    C.setValue(address, start2, "i32");
    C.setValue(address + SIZE_OF_INT, end, "i32");
    C._ts_node_named_descendant_for_index_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the smallest node within this node that spans the given point range. */
  descendantForPosition(start2, end = start2) {
    if (!isPoint(start2) || !isPoint(end)) {
      throw new Error("Arguments must be {row, column} objects");
    }
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    marshalPoint(address, start2);
    marshalPoint(address + SIZE_OF_POINT, end);
    C._ts_node_descendant_for_position_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /** Get the smallest named node within this node that spans the given point range. */
  namedDescendantForPosition(start2, end = start2) {
    if (!isPoint(start2) || !isPoint(end)) {
      throw new Error("Arguments must be {row, column} objects");
    }
    marshalNode(this);
    const address = TRANSFER_BUFFER + SIZE_OF_NODE;
    marshalPoint(address, start2);
    marshalPoint(address + SIZE_OF_POINT, end);
    C._ts_node_named_descendant_for_position_wasm(this.tree[0]);
    return unmarshalNode(this.tree);
  }
  /**
   * Create a new {@link TreeCursor} starting from this node.
   *
   * Note that the given node is considered the root of the cursor,
   * and the cursor cannot walk outside this node.
   */
  walk() {
    marshalNode(this);
    C._ts_tree_cursor_new_wasm(this.tree[0]);
    return new TreeCursor(INTERNAL, this.tree);
  }
  /**
   * Edit this node to keep it in-sync with source code that has been edited.
   *
   * This function is only rarely needed. When you edit a syntax tree with
   * the {@link Tree#edit} method, all of the nodes that you retrieve from
   * the tree afterward will already reflect the edit. You only need to
   * use {@link Node#edit} when you have a specific {@link Node} instance that
   * you want to keep and continue to use after an edit.
   */
  edit(edit) {
    if (this.startIndex >= edit.oldEndIndex) {
      this.startIndex = edit.newEndIndex + (this.startIndex - edit.oldEndIndex);
      let subbedPointRow;
      let subbedPointColumn;
      if (this.startPosition.row > edit.oldEndPosition.row) {
        subbedPointRow = this.startPosition.row - edit.oldEndPosition.row;
        subbedPointColumn = this.startPosition.column;
      } else {
        subbedPointRow = 0;
        subbedPointColumn = this.startPosition.column;
        if (this.startPosition.column >= edit.oldEndPosition.column) {
          subbedPointColumn = this.startPosition.column - edit.oldEndPosition.column;
        }
      }
      if (subbedPointRow > 0) {
        this.startPosition.row += subbedPointRow;
        this.startPosition.column = subbedPointColumn;
      } else {
        this.startPosition.column += subbedPointColumn;
      }
    } else if (this.startIndex > edit.startIndex) {
      this.startIndex = edit.newEndIndex;
      this.startPosition.row = edit.newEndPosition.row;
      this.startPosition.column = edit.newEndPosition.column;
    }
  }
  /** Get the S-expression representation of this node. */
  toString() {
    marshalNode(this);
    const address = C._ts_node_to_string_wasm(this.tree[0]);
    const result = C.AsciiToString(address);
    C._free(address);
    return result;
  }
};
function unmarshalCaptures(query, tree, address, patternIndex, result) {
  for (let i2 = 0, n = result.length; i2 < n; i2++) {
    const captureIndex = C.getValue(address, "i32");
    address += SIZE_OF_INT;
    const node = unmarshalNode(tree, address);
    address += SIZE_OF_NODE;
    result[i2] = { patternIndex, name: query.captureNames[captureIndex], node };
  }
  return address;
}
__name(unmarshalCaptures, "unmarshalCaptures");
function marshalNode(node, index = 0) {
  let address = TRANSFER_BUFFER + index * SIZE_OF_NODE;
  C.setValue(address, node.id, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, node.startIndex, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, node.startPosition.row, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, node.startPosition.column, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, node[0], "i32");
}
__name(marshalNode, "marshalNode");
function unmarshalNode(tree, address = TRANSFER_BUFFER) {
  const id = C.getValue(address, "i32");
  address += SIZE_OF_INT;
  if (id === 0) return null;
  const index = C.getValue(address, "i32");
  address += SIZE_OF_INT;
  const row = C.getValue(address, "i32");
  address += SIZE_OF_INT;
  const column = C.getValue(address, "i32");
  address += SIZE_OF_INT;
  const other = C.getValue(address, "i32");
  const result = new Node(INTERNAL, {
    id,
    tree,
    startIndex: index,
    startPosition: { row, column },
    other
  });
  return result;
}
__name(unmarshalNode, "unmarshalNode");
function marshalTreeCursor(cursor, address = TRANSFER_BUFFER) {
  C.setValue(address + 0 * SIZE_OF_INT, cursor[0], "i32");
  C.setValue(address + 1 * SIZE_OF_INT, cursor[1], "i32");
  C.setValue(address + 2 * SIZE_OF_INT, cursor[2], "i32");
  C.setValue(address + 3 * SIZE_OF_INT, cursor[3], "i32");
}
__name(marshalTreeCursor, "marshalTreeCursor");
function unmarshalTreeCursor(cursor) {
  cursor[0] = C.getValue(TRANSFER_BUFFER + 0 * SIZE_OF_INT, "i32");
  cursor[1] = C.getValue(TRANSFER_BUFFER + 1 * SIZE_OF_INT, "i32");
  cursor[2] = C.getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
  cursor[3] = C.getValue(TRANSFER_BUFFER + 3 * SIZE_OF_INT, "i32");
}
__name(unmarshalTreeCursor, "unmarshalTreeCursor");
function marshalPoint(address, point) {
  C.setValue(address, point.row, "i32");
  C.setValue(address + SIZE_OF_INT, point.column, "i32");
}
__name(marshalPoint, "marshalPoint");
function unmarshalPoint(address) {
  const result = {
    row: C.getValue(address, "i32") >>> 0,
    column: C.getValue(address + SIZE_OF_INT, "i32") >>> 0
  };
  return result;
}
__name(unmarshalPoint, "unmarshalPoint");
function marshalRange(address, range) {
  marshalPoint(address, range.startPosition);
  address += SIZE_OF_POINT;
  marshalPoint(address, range.endPosition);
  address += SIZE_OF_POINT;
  C.setValue(address, range.startIndex, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, range.endIndex, "i32");
  address += SIZE_OF_INT;
}
__name(marshalRange, "marshalRange");
function unmarshalRange(address) {
  const result = {};
  result.startPosition = unmarshalPoint(address);
  address += SIZE_OF_POINT;
  result.endPosition = unmarshalPoint(address);
  address += SIZE_OF_POINT;
  result.startIndex = C.getValue(address, "i32") >>> 0;
  address += SIZE_OF_INT;
  result.endIndex = C.getValue(address, "i32") >>> 0;
  return result;
}
__name(unmarshalRange, "unmarshalRange");
function marshalEdit(edit, address = TRANSFER_BUFFER) {
  marshalPoint(address, edit.startPosition);
  address += SIZE_OF_POINT;
  marshalPoint(address, edit.oldEndPosition);
  address += SIZE_OF_POINT;
  marshalPoint(address, edit.newEndPosition);
  address += SIZE_OF_POINT;
  C.setValue(address, edit.startIndex, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, edit.oldEndIndex, "i32");
  address += SIZE_OF_INT;
  C.setValue(address, edit.newEndIndex, "i32");
  address += SIZE_OF_INT;
}
__name(marshalEdit, "marshalEdit");
function unmarshalLanguageMetadata(address) {
  const major_version = C.getValue(address, "i32");
  const minor_version = C.getValue(address += SIZE_OF_INT, "i32");
  const patch_version = C.getValue(address += SIZE_OF_INT, "i32");
  return { major_version, minor_version, patch_version };
}
__name(unmarshalLanguageMetadata, "unmarshalLanguageMetadata");
var LANGUAGE_FUNCTION_REGEX = /^tree_sitter_\w+$/;
var Language = class _Language {
  static {
    __name(this, "Language");
  }
  /** @internal */
  [0] = 0;
  // Internal handle for Wasm
  /**
   * A list of all node types in the language. The index of each type in this
   * array is its node type id.
   */
  types;
  /**
   * A list of all field names in the language. The index of each field name in
   * this array is its field id.
   */
  fields;
  /** @internal */
  constructor(internal, address) {
    assertInternal(internal);
    this[0] = address;
    this.types = new Array(C._ts_language_symbol_count(this[0]));
    for (let i2 = 0, n = this.types.length; i2 < n; i2++) {
      if (C._ts_language_symbol_type(this[0], i2) < 2) {
        this.types[i2] = C.UTF8ToString(C._ts_language_symbol_name(this[0], i2));
      }
    }
    this.fields = new Array(C._ts_language_field_count(this[0]) + 1);
    for (let i2 = 0, n = this.fields.length; i2 < n; i2++) {
      const fieldName = C._ts_language_field_name_for_id(this[0], i2);
      if (fieldName !== 0) {
        this.fields[i2] = C.UTF8ToString(fieldName);
      } else {
        this.fields[i2] = null;
      }
    }
  }
  /**
   * Gets the name of the language.
   */
  get name() {
    const ptr = C._ts_language_name(this[0]);
    if (ptr === 0) return null;
    return C.UTF8ToString(ptr);
  }
  /**
   * Gets the ABI version of the language.
   */
  get abiVersion() {
    return C._ts_language_abi_version(this[0]);
  }
  /**
  * Get the metadata for this language. This information is generated by the
  * CLI, and relies on the language author providing the correct metadata in
  * the language's `tree-sitter.json` file.
  */
  get metadata() {
    C._ts_language_metadata_wasm(this[0]);
    const length = C.getValue(TRANSFER_BUFFER, "i32");
    if (length === 0) return null;
    return unmarshalLanguageMetadata(TRANSFER_BUFFER + SIZE_OF_INT);
  }
  /**
   * Gets the number of fields in the language.
   */
  get fieldCount() {
    return this.fields.length - 1;
  }
  /**
   * Gets the number of states in the language.
   */
  get stateCount() {
    return C._ts_language_state_count(this[0]);
  }
  /**
   * Get the field id for a field name.
   */
  fieldIdForName(fieldName) {
    const result = this.fields.indexOf(fieldName);
    return result !== -1 ? result : null;
  }
  /**
   * Get the field name for a field id.
   */
  fieldNameForId(fieldId) {
    return this.fields[fieldId] ?? null;
  }
  /**
   * Get the node type id for a node type name.
   */
  idForNodeType(type, named) {
    const typeLength = C.lengthBytesUTF8(type);
    const typeAddress = C._malloc(typeLength + 1);
    C.stringToUTF8(type, typeAddress, typeLength + 1);
    const result = C._ts_language_symbol_for_name(this[0], typeAddress, typeLength, named ? 1 : 0);
    C._free(typeAddress);
    return result || null;
  }
  /**
   * Gets the number of node types in the language.
   */
  get nodeTypeCount() {
    return C._ts_language_symbol_count(this[0]);
  }
  /**
   * Get the node type name for a node type id.
   */
  nodeTypeForId(typeId) {
    const name2 = C._ts_language_symbol_name(this[0], typeId);
    return name2 ? C.UTF8ToString(name2) : null;
  }
  /**
   * Check if a node type is named.
   *
   * @see {@link https://tree-sitter.github.io/tree-sitter/using-parsers/2-basic-parsing.html#named-vs-anonymous-nodes}
   */
  nodeTypeIsNamed(typeId) {
    return C._ts_language_type_is_named_wasm(this[0], typeId) ? true : false;
  }
  /**
   * Check if a node type is visible.
   */
  nodeTypeIsVisible(typeId) {
    return C._ts_language_type_is_visible_wasm(this[0], typeId) ? true : false;
  }
  /**
   * Get the supertypes ids of this language.
   *
   * @see {@link https://tree-sitter.github.io/tree-sitter/using-parsers/6-static-node-types.html?highlight=supertype#supertype-nodes}
   */
  get supertypes() {
    C._ts_language_supertypes_wasm(this[0]);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = C.getValue(address, "i16");
        address += SIZE_OF_SHORT;
      }
    }
    return result;
  }
  /**
   * Get the subtype ids for a given supertype node id.
   */
  subtypes(supertype) {
    C._ts_language_subtypes_wasm(this[0], supertype);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = C.getValue(address, "i16");
        address += SIZE_OF_SHORT;
      }
    }
    return result;
  }
  /**
   * Get the next state id for a given state id and node type id.
   */
  nextState(stateId, typeId) {
    return C._ts_language_next_state(this[0], stateId, typeId);
  }
  /**
   * Create a new lookahead iterator for this language and parse state.
   *
   * This returns `null` if state is invalid for this language.
   *
   * Iterating {@link LookaheadIterator} will yield valid symbols in the given
   * parse state. Newly created lookahead iterators will return the `ERROR`
   * symbol from {@link LookaheadIterator#currentType}.
   *
   * Lookahead iterators can be useful for generating suggestions and improving
   * syntax error diagnostics. To get symbols valid in an `ERROR` node, use the
   * lookahead iterator on its first leaf node state. For `MISSING` nodes, a
   * lookahead iterator created on the previous non-extra leaf node may be
   * appropriate.
   */
  lookaheadIterator(stateId) {
    const address = C._ts_lookahead_iterator_new(this[0], stateId);
    if (address) return new LookaheadIterator(INTERNAL, address, this);
    return null;
  }
  /**
   * Load a language from a WebAssembly module.
   * The module can be provided as a path to a file or as a buffer.
   */
  static async load(input) {
    let binary2;
    if (input instanceof Uint8Array) {
      binary2 = input;
    } else if (globalThis.process?.versions.node) {
      const fs2 = await import("fs/promises");
      binary2 = await fs2.readFile(input);
    } else {
      const response = await fetch(input);
      if (!response.ok) {
        const body2 = await response.text();
        throw new Error(`Language.load failed with status ${response.status}.

${body2}`);
      }
      const retryResp = response.clone();
      try {
        binary2 = await WebAssembly.compileStreaming(response);
      } catch (reason) {
        console.error("wasm streaming compile failed:", reason);
        console.error("falling back to ArrayBuffer instantiation");
        binary2 = new Uint8Array(await retryResp.arrayBuffer());
      }
    }
    const mod = await C.loadWebAssemblyModule(binary2, { loadAsync: true });
    const symbolNames = Object.keys(mod);
    const functionName = symbolNames.find((key) => LANGUAGE_FUNCTION_REGEX.test(key) && !key.includes("external_scanner_"));
    if (!functionName) {
      console.log(`Couldn't find language function in Wasm file. Symbols:
${JSON.stringify(symbolNames, null, 2)}`);
      throw new Error("Language.load failed: no language function found in Wasm file");
    }
    const languageAddress = mod[functionName]();
    return new _Language(INTERNAL, languageAddress);
  }
};
async function Module2(moduleArg = {}) {
  var moduleRtn;
  var Module = moduleArg;
  var ENVIRONMENT_IS_WEB = typeof window == "object";
  var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
  var ENVIRONMENT_IS_NODE = typeof process == "object" && process.versions?.node && process.type != "renderer";
  if (ENVIRONMENT_IS_NODE) {
    const { createRequire } = await import("module");
    var require = createRequire(import_meta.url);
  }
  Module.currentQueryProgressCallback = null;
  Module.currentProgressCallback = null;
  Module.currentLogCallback = null;
  Module.currentParseCallback = null;
  var arguments_ = [];
  var thisProgram = "./this.program";
  var quit_ = /* @__PURE__ */ __name((status, toThrow) => {
    throw toThrow;
  }, "quit_");
  var _scriptName = import_meta.url;
  var scriptDirectory = "";
  function locateFile(path) {
    if (Module["locateFile"]) {
      return Module["locateFile"](path, scriptDirectory);
    }
    return scriptDirectory + path;
  }
  __name(locateFile, "locateFile");
  var readAsync, readBinary;
  if (ENVIRONMENT_IS_NODE) {
    var fs = require("fs");
    if (_scriptName.startsWith("file:")) {
      scriptDirectory = require("path").dirname(require("url").fileURLToPath(_scriptName)) + "/";
    }
    readBinary = /* @__PURE__ */ __name((filename) => {
      filename = isFileURI(filename) ? new URL(filename) : filename;
      var ret = fs.readFileSync(filename);
      return ret;
    }, "readBinary");
    readAsync = /* @__PURE__ */ __name(async (filename, binary2 = true) => {
      filename = isFileURI(filename) ? new URL(filename) : filename;
      var ret = fs.readFileSync(filename, binary2 ? void 0 : "utf8");
      return ret;
    }, "readAsync");
    if (process.argv.length > 1) {
      thisProgram = process.argv[1].replace(/\\/g, "/");
    }
    arguments_ = process.argv.slice(2);
    quit_ = /* @__PURE__ */ __name((status, toThrow) => {
      process.exitCode = status;
      throw toThrow;
    }, "quit_");
  } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    try {
      scriptDirectory = new URL(".", _scriptName).href;
    } catch {
    }
    {
      if (ENVIRONMENT_IS_WORKER) {
        readBinary = /* @__PURE__ */ __name((url) => {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.responseType = "arraybuffer";
          xhr.send(null);
          return new Uint8Array(
            /** @type{!ArrayBuffer} */
            xhr.response
          );
        }, "readBinary");
      }
      readAsync = /* @__PURE__ */ __name(async (url) => {
        if (isFileURI(url)) {
          return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = () => {
              if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                resolve(xhr.response);
                return;
              }
              reject(xhr.status);
            };
            xhr.onerror = reject;
            xhr.send(null);
          });
        }
        var response = await fetch(url, {
          credentials: "same-origin"
        });
        if (response.ok) {
          return response.arrayBuffer();
        }
        throw new Error(response.status + " : " + response.url);
      }, "readAsync");
    }
  } else {
  }
  var out = console.log.bind(console);
  var err = console.error.bind(console);
  var dynamicLibraries = [];
  var wasmBinary;
  var ABORT = false;
  var EXITSTATUS;
  var isFileURI = /* @__PURE__ */ __name((filename) => filename.startsWith("file://"), "isFileURI");
  var readyPromiseResolve, readyPromiseReject;
  var wasmMemory;
  var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
  var HEAP64, HEAPU64;
  var HEAP_DATA_VIEW;
  var runtimeInitialized = false;
  function updateMemoryViews() {
    var b = wasmMemory.buffer;
    Module["HEAP8"] = HEAP8 = new Int8Array(b);
    Module["HEAP16"] = HEAP16 = new Int16Array(b);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
    Module["HEAP32"] = HEAP32 = new Int32Array(b);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
    Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
    Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b);
    Module["HEAP_DATA_VIEW"] = HEAP_DATA_VIEW = new DataView(b);
    LE_HEAP_UPDATE();
  }
  __name(updateMemoryViews, "updateMemoryViews");
  function initMemory() {
    if (Module["wasmMemory"]) {
      wasmMemory = Module["wasmMemory"];
    } else {
      var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 33554432;
      wasmMemory = new WebAssembly.Memory({
        "initial": INITIAL_MEMORY / 65536,
        // In theory we should not need to emit the maximum if we want "unlimited"
        // or 4GB of memory, but VMs error on that atm, see
        // https://github.com/emscripten-core/emscripten/issues/14130
        // And in the pthreads case we definitely need to emit a maximum. So
        // always emit one.
        "maximum": 32768
      });
    }
    updateMemoryViews();
  }
  __name(initMemory, "initMemory");
  var __RELOC_FUNCS__ = [];
  function preRun() {
    if (Module["preRun"]) {
      if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
      while (Module["preRun"].length) {
        addOnPreRun(Module["preRun"].shift());
      }
    }
    callRuntimeCallbacks(onPreRuns);
  }
  __name(preRun, "preRun");
  function initRuntime() {
    runtimeInitialized = true;
    callRuntimeCallbacks(__RELOC_FUNCS__);
    wasmExports["__wasm_call_ctors"]();
    callRuntimeCallbacks(onPostCtors);
  }
  __name(initRuntime, "initRuntime");
  function preMain() {
  }
  __name(preMain, "preMain");
  function postRun() {
    if (Module["postRun"]) {
      if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
      while (Module["postRun"].length) {
        addOnPostRun(Module["postRun"].shift());
      }
    }
    callRuntimeCallbacks(onPostRuns);
  }
  __name(postRun, "postRun");
  function abort(what) {
    Module["onAbort"]?.(what);
    what = "Aborted(" + what + ")";
    err(what);
    ABORT = true;
    what += ". Build with -sASSERTIONS for more info.";
    var e = new WebAssembly.RuntimeError(what);
    readyPromiseReject?.(e);
    throw e;
  }
  __name(abort, "abort");
  var wasmBinaryFile;
  function findWasmBinary() {
    if (Module["locateFile"]) {
      return locateFile("web-tree-sitter.wasm");
    }
    return new URL("web-tree-sitter.wasm", import_meta.url).href;
  }
  __name(findWasmBinary, "findWasmBinary");
  function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  }
  __name(getBinarySync, "getBinarySync");
  async function getWasmBinary(binaryFile) {
    if (!wasmBinary) {
      try {
        var response = await readAsync(binaryFile);
        return new Uint8Array(response);
      } catch {
      }
    }
    return getBinarySync(binaryFile);
  }
  __name(getWasmBinary, "getWasmBinary");
  async function instantiateArrayBuffer(binaryFile, imports) {
    try {
      var binary2 = await getWasmBinary(binaryFile);
      var instance2 = await WebAssembly.instantiate(binary2, imports);
      return instance2;
    } catch (reason) {
      err(`failed to asynchronously prepare wasm: ${reason}`);
      abort(reason);
    }
  }
  __name(instantiateArrayBuffer, "instantiateArrayBuffer");
  async function instantiateAsync(binary2, binaryFile, imports) {
    if (!binary2 && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE) {
      try {
        var response = fetch(binaryFile, {
          credentials: "same-origin"
        });
        var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
        return instantiationResult;
      } catch (reason) {
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
      }
    }
    return instantiateArrayBuffer(binaryFile, imports);
  }
  __name(instantiateAsync, "instantiateAsync");
  function getWasmImports() {
    return {
      "env": wasmImports,
      "wasi_snapshot_preview1": wasmImports,
      "GOT.mem": new Proxy(wasmImports, GOTHandler),
      "GOT.func": new Proxy(wasmImports, GOTHandler)
    };
  }
  __name(getWasmImports, "getWasmImports");
  async function createWasm() {
    function receiveInstance(instance2, module2) {
      wasmExports = instance2.exports;
      wasmExports = relocateExports(wasmExports, 1024);
      var metadata2 = getDylinkMetadata(module2);
      if (metadata2.neededDynlibs) {
        dynamicLibraries = metadata2.neededDynlibs.concat(dynamicLibraries);
      }
      mergeLibSymbols(wasmExports, "main");
      LDSO.init();
      loadDylibs();
      __RELOC_FUNCS__.push(wasmExports["__wasm_apply_data_relocs"]);
      assignWasmExports(wasmExports);
      return wasmExports;
    }
    __name(receiveInstance, "receiveInstance");
    function receiveInstantiationResult(result2) {
      return receiveInstance(result2["instance"], result2["module"]);
    }
    __name(receiveInstantiationResult, "receiveInstantiationResult");
    var info2 = getWasmImports();
    if (Module["instantiateWasm"]) {
      return new Promise((resolve, reject) => {
        Module["instantiateWasm"](info2, (mod, inst) => {
          resolve(receiveInstance(mod, inst));
        });
      });
    }
    wasmBinaryFile ??= findWasmBinary();
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info2);
    var exports2 = receiveInstantiationResult(result);
    return exports2;
  }
  __name(createWasm, "createWasm");
  class ExitStatus {
    static {
      __name(this, "ExitStatus");
    }
    name = "ExitStatus";
    constructor(status) {
      this.message = `Program terminated with exit(${status})`;
      this.status = status;
    }
  }
  var GOT = {};
  var currentModuleWeakSymbols = /* @__PURE__ */ new Set([]);
  var GOTHandler = {
    get(obj, symName) {
      var rtn = GOT[symName];
      if (!rtn) {
        rtn = GOT[symName] = new WebAssembly.Global({
          "value": "i32",
          "mutable": true
        });
      }
      if (!currentModuleWeakSymbols.has(symName)) {
        rtn.required = true;
      }
      return rtn;
    }
  };
  var LE_ATOMICS_NATIVE_BYTE_ORDER = [];
  var LE_HEAP_LOAD_F32 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getFloat32(byteOffset, true), "LE_HEAP_LOAD_F32");
  var LE_HEAP_LOAD_F64 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getFloat64(byteOffset, true), "LE_HEAP_LOAD_F64");
  var LE_HEAP_LOAD_I16 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getInt16(byteOffset, true), "LE_HEAP_LOAD_I16");
  var LE_HEAP_LOAD_I32 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getInt32(byteOffset, true), "LE_HEAP_LOAD_I32");
  var LE_HEAP_LOAD_I64 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getBigInt64(byteOffset, true), "LE_HEAP_LOAD_I64");
  var LE_HEAP_LOAD_U32 = /* @__PURE__ */ __name((byteOffset) => HEAP_DATA_VIEW.getUint32(byteOffset, true), "LE_HEAP_LOAD_U32");
  var LE_HEAP_STORE_F32 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setFloat32(byteOffset, value, true), "LE_HEAP_STORE_F32");
  var LE_HEAP_STORE_F64 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setFloat64(byteOffset, value, true), "LE_HEAP_STORE_F64");
  var LE_HEAP_STORE_I16 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setInt16(byteOffset, value, true), "LE_HEAP_STORE_I16");
  var LE_HEAP_STORE_I32 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setInt32(byteOffset, value, true), "LE_HEAP_STORE_I32");
  var LE_HEAP_STORE_I64 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setBigInt64(byteOffset, value, true), "LE_HEAP_STORE_I64");
  var LE_HEAP_STORE_U32 = /* @__PURE__ */ __name((byteOffset, value) => HEAP_DATA_VIEW.setUint32(byteOffset, value, true), "LE_HEAP_STORE_U32");
  var callRuntimeCallbacks = /* @__PURE__ */ __name((callbacks) => {
    while (callbacks.length > 0) {
      callbacks.shift()(Module);
    }
  }, "callRuntimeCallbacks");
  var onPostRuns = [];
  var addOnPostRun = /* @__PURE__ */ __name((cb) => onPostRuns.push(cb), "addOnPostRun");
  var onPreRuns = [];
  var addOnPreRun = /* @__PURE__ */ __name((cb) => onPreRuns.push(cb), "addOnPreRun");
  var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder() : void 0;
  var findStringEnd = /* @__PURE__ */ __name((heapOrArray, idx, maxBytesToRead, ignoreNul) => {
    var maxIdx = idx + maxBytesToRead;
    if (ignoreNul) return maxIdx;
    while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
    return idx;
  }, "findStringEnd");
  var UTF8ArrayToString = /* @__PURE__ */ __name((heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
    var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
      return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
    }
    var str = "";
    while (idx < endPtr) {
      var u0 = heapOrArray[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      var u1 = heapOrArray[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }
      var u2 = heapOrArray[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
    return str;
  }, "UTF8ArrayToString");
  var getDylinkMetadata = /* @__PURE__ */ __name((binary2) => {
    var offset = 0;
    var end = 0;
    function getU8() {
      return binary2[offset++];
    }
    __name(getU8, "getU8");
    function getLEB() {
      var ret = 0;
      var mul = 1;
      while (1) {
        var byte = binary2[offset++];
        ret += (byte & 127) * mul;
        mul *= 128;
        if (!(byte & 128)) break;
      }
      return ret;
    }
    __name(getLEB, "getLEB");
    function getString() {
      var len = getLEB();
      offset += len;
      return UTF8ArrayToString(binary2, offset - len, len);
    }
    __name(getString, "getString");
    function getStringList() {
      var count2 = getLEB();
      var rtn = [];
      while (count2--) rtn.push(getString());
      return rtn;
    }
    __name(getStringList, "getStringList");
    function failIf(condition, message) {
      if (condition) throw new Error(message);
    }
    __name(failIf, "failIf");
    if (binary2 instanceof WebAssembly.Module) {
      var dylinkSection = WebAssembly.Module.customSections(binary2, "dylink.0");
      failIf(dylinkSection.length === 0, "need dylink section");
      binary2 = new Uint8Array(dylinkSection[0]);
      end = binary2.length;
    } else {
      var int32View = new Uint32Array(new Uint8Array(binary2.subarray(0, 24)).buffer);
      var magicNumberFound = int32View[0] == 1836278016 || int32View[0] == 6386541;
      failIf(!magicNumberFound, "need to see wasm magic number");
      failIf(binary2[8] !== 0, "need the dylink section to be first");
      offset = 9;
      var section_size = getLEB();
      end = offset + section_size;
      var name2 = getString();
      failIf(name2 !== "dylink.0");
    }
    var customSection = {
      neededDynlibs: [],
      tlsExports: /* @__PURE__ */ new Set(),
      weakImports: /* @__PURE__ */ new Set(),
      runtimePaths: []
    };
    var WASM_DYLINK_MEM_INFO = 1;
    var WASM_DYLINK_NEEDED = 2;
    var WASM_DYLINK_EXPORT_INFO = 3;
    var WASM_DYLINK_IMPORT_INFO = 4;
    var WASM_DYLINK_RUNTIME_PATH = 5;
    var WASM_SYMBOL_TLS = 256;
    var WASM_SYMBOL_BINDING_MASK = 3;
    var WASM_SYMBOL_BINDING_WEAK = 1;
    while (offset < end) {
      var subsectionType = getU8();
      var subsectionSize = getLEB();
      if (subsectionType === WASM_DYLINK_MEM_INFO) {
        customSection.memorySize = getLEB();
        customSection.memoryAlign = getLEB();
        customSection.tableSize = getLEB();
        customSection.tableAlign = getLEB();
      } else if (subsectionType === WASM_DYLINK_NEEDED) {
        customSection.neededDynlibs = getStringList();
      } else if (subsectionType === WASM_DYLINK_EXPORT_INFO) {
        var count = getLEB();
        while (count--) {
          var symname = getString();
          var flags2 = getLEB();
          if (flags2 & WASM_SYMBOL_TLS) {
            customSection.tlsExports.add(symname);
          }
        }
      } else if (subsectionType === WASM_DYLINK_IMPORT_INFO) {
        var count = getLEB();
        while (count--) {
          var modname = getString();
          var symname = getString();
          var flags2 = getLEB();
          if ((flags2 & WASM_SYMBOL_BINDING_MASK) == WASM_SYMBOL_BINDING_WEAK) {
            customSection.weakImports.add(symname);
          }
        }
      } else if (subsectionType === WASM_DYLINK_RUNTIME_PATH) {
        customSection.runtimePaths = getStringList();
      } else {
        offset += subsectionSize;
      }
    }
    return customSection;
  }, "getDylinkMetadata");
  function getValue(ptr, type = "i8") {
    if (type.endsWith("*")) type = "*";
    switch (type) {
      case "i1":
        return HEAP8[ptr];
      case "i8":
        return HEAP8[ptr];
      case "i16":
        return LE_HEAP_LOAD_I16((ptr >> 1) * 2);
      case "i32":
        return LE_HEAP_LOAD_I32((ptr >> 2) * 4);
      case "i64":
        return LE_HEAP_LOAD_I64((ptr >> 3) * 8);
      case "float":
        return LE_HEAP_LOAD_F32((ptr >> 2) * 4);
      case "double":
        return LE_HEAP_LOAD_F64((ptr >> 3) * 8);
      case "*":
        return LE_HEAP_LOAD_U32((ptr >> 2) * 4);
      default:
        abort(`invalid type for getValue: ${type}`);
    }
  }
  __name(getValue, "getValue");
  var newDSO = /* @__PURE__ */ __name((name2, handle2, syms) => {
    var dso = {
      refcount: Infinity,
      name: name2,
      exports: syms,
      global: true
    };
    LDSO.loadedLibsByName[name2] = dso;
    if (handle2 != void 0) {
      LDSO.loadedLibsByHandle[handle2] = dso;
    }
    return dso;
  }, "newDSO");
  var LDSO = {
    loadedLibsByName: {},
    loadedLibsByHandle: {},
    init() {
      newDSO("__main__", 0, wasmImports);
    }
  };
  var ___heap_base = 78240;
  var alignMemory = /* @__PURE__ */ __name((size, alignment) => Math.ceil(size / alignment) * alignment, "alignMemory");
  var getMemory = /* @__PURE__ */ __name((size) => {
    if (runtimeInitialized) {
      return _calloc(size, 1);
    }
    var ret = ___heap_base;
    var end = ret + alignMemory(size, 16);
    ___heap_base = end;
    GOT["__heap_base"].value = end;
    return ret;
  }, "getMemory");
  var isInternalSym = /* @__PURE__ */ __name((symName) => ["__cpp_exception", "__c_longjmp", "__wasm_apply_data_relocs", "__dso_handle", "__tls_size", "__tls_align", "__set_stack_limits", "_emscripten_tls_init", "__wasm_init_tls", "__wasm_call_ctors", "__start_em_asm", "__stop_em_asm", "__start_em_js", "__stop_em_js"].includes(symName) || symName.startsWith("__em_js__"), "isInternalSym");
  var uleb128EncodeWithLen = /* @__PURE__ */ __name((arr) => {
    const n = arr.length;
    return [n % 128 | 128, n >> 7, ...arr];
  }, "uleb128EncodeWithLen");
  var wasmTypeCodes = {
    "i": 127,
    // i32
    "p": 127,
    // i32
    "j": 126,
    // i64
    "f": 125,
    // f32
    "d": 124,
    // f64
    "e": 111
  };
  var generateTypePack = /* @__PURE__ */ __name((types) => uleb128EncodeWithLen(Array.from(types, (type) => {
    var code = wasmTypeCodes[type];
    return code;
  })), "generateTypePack");
  var convertJsFunctionToWasm = /* @__PURE__ */ __name((func2, sig) => {
    var bytes = Uint8Array.of(
      0,
      97,
      115,
      109,
      // magic ("\0asm")
      1,
      0,
      0,
      0,
      // version: 1
      1,
      ...uleb128EncodeWithLen([
        1,
        // count: 1
        96,
        // param types
        ...generateTypePack(sig.slice(1)),
        // return types (for now only supporting [] if `void` and single [T] otherwise)
        ...generateTypePack(sig[0] === "v" ? "" : sig[0])
      ]),
      // The rest of the module is static
      2,
      7,
      // import section
      // (import "e" "f" (func 0 (type 0)))
      1,
      1,
      101,
      1,
      102,
      0,
      0,
      7,
      5,
      // export section
      // (export "f" (func 0 (type 0)))
      1,
      1,
      102,
      0,
      0
    );
    var module2 = new WebAssembly.Module(bytes);
    var instance2 = new WebAssembly.Instance(module2, {
      "e": {
        "f": func2
      }
    });
    var wrappedFunc = instance2.exports["f"];
    return wrappedFunc;
  }, "convertJsFunctionToWasm");
  var wasmTableMirror = [];
  var wasmTable = new WebAssembly.Table({
    "initial": 31,
    "element": "anyfunc"
  });
  var getWasmTableEntry = /* @__PURE__ */ __name((funcPtr) => {
    var func2 = wasmTableMirror[funcPtr];
    if (!func2) {
      wasmTableMirror[funcPtr] = func2 = wasmTable.get(funcPtr);
    }
    return func2;
  }, "getWasmTableEntry");
  var updateTableMap = /* @__PURE__ */ __name((offset, count) => {
    if (functionsInTableMap) {
      for (var i2 = offset; i2 < offset + count; i2++) {
        var item = getWasmTableEntry(i2);
        if (item) {
          functionsInTableMap.set(item, i2);
        }
      }
    }
  }, "updateTableMap");
  var functionsInTableMap;
  var getFunctionAddress = /* @__PURE__ */ __name((func2) => {
    if (!functionsInTableMap) {
      functionsInTableMap = /* @__PURE__ */ new WeakMap();
      updateTableMap(0, wasmTable.length);
    }
    return functionsInTableMap.get(func2) || 0;
  }, "getFunctionAddress");
  var freeTableIndexes = [];
  var getEmptyTableSlot = /* @__PURE__ */ __name(() => {
    if (freeTableIndexes.length) {
      return freeTableIndexes.pop();
    }
    return wasmTable["grow"](1);
  }, "getEmptyTableSlot");
  var setWasmTableEntry = /* @__PURE__ */ __name((idx, func2) => {
    wasmTable.set(idx, func2);
    wasmTableMirror[idx] = wasmTable.get(idx);
  }, "setWasmTableEntry");
  var addFunction = /* @__PURE__ */ __name((func2, sig) => {
    var rtn = getFunctionAddress(func2);
    if (rtn) {
      return rtn;
    }
    var ret = getEmptyTableSlot();
    try {
      setWasmTableEntry(ret, func2);
    } catch (err2) {
      if (!(err2 instanceof TypeError)) {
        throw err2;
      }
      var wrapped = convertJsFunctionToWasm(func2, sig);
      setWasmTableEntry(ret, wrapped);
    }
    functionsInTableMap.set(func2, ret);
    return ret;
  }, "addFunction");
  var updateGOT = /* @__PURE__ */ __name((exports2, replace) => {
    for (var symName in exports2) {
      if (isInternalSym(symName)) {
        continue;
      }
      var value = exports2[symName];
      GOT[symName] ||= new WebAssembly.Global({
        "value": "i32",
        "mutable": true
      });
      if (replace || GOT[symName].value == 0) {
        if (typeof value == "function") {
          GOT[symName].value = addFunction(value);
        } else if (typeof value == "number") {
          GOT[symName].value = value;
        } else {
          err(`unhandled export type for '${symName}': ${typeof value}`);
        }
      }
    }
  }, "updateGOT");
  var relocateExports = /* @__PURE__ */ __name((exports2, memoryBase2, replace) => {
    var relocated = {};
    for (var e in exports2) {
      var value = exports2[e];
      if (typeof value == "object") {
        value = value.value;
      }
      if (typeof value == "number") {
        value += memoryBase2;
      }
      relocated[e] = value;
    }
    updateGOT(relocated, replace);
    return relocated;
  }, "relocateExports");
  var isSymbolDefined = /* @__PURE__ */ __name((symName) => {
    var existing = wasmImports[symName];
    if (!existing || existing.stub) {
      return false;
    }
    return true;
  }, "isSymbolDefined");
  var dynCall = /* @__PURE__ */ __name((sig, ptr, args2 = [], promising = false) => {
    var func2 = getWasmTableEntry(ptr);
    var rtn = func2(...args2);
    function convert(rtn2) {
      return rtn2;
    }
    __name(convert, "convert");
    return convert(rtn);
  }, "dynCall");
  var stackSave = /* @__PURE__ */ __name(() => _emscripten_stack_get_current(), "stackSave");
  var stackRestore = /* @__PURE__ */ __name((val) => __emscripten_stack_restore(val), "stackRestore");
  var createInvokeFunction = /* @__PURE__ */ __name((sig) => (ptr, ...args2) => {
    var sp = stackSave();
    try {
      return dynCall(sig, ptr, args2);
    } catch (e) {
      stackRestore(sp);
      if (e !== e + 0) throw e;
      _setThrew(1, 0);
      if (sig[0] == "j") return 0n;
    }
  }, "createInvokeFunction");
  var resolveGlobalSymbol = /* @__PURE__ */ __name((symName, direct = false) => {
    var sym;
    if (isSymbolDefined(symName)) {
      sym = wasmImports[symName];
    } else if (symName.startsWith("invoke_")) {
      sym = wasmImports[symName] = createInvokeFunction(symName.split("_")[1]);
    }
    return {
      sym,
      name: symName
    };
  }, "resolveGlobalSymbol");
  var onPostCtors = [];
  var addOnPostCtor = /* @__PURE__ */ __name((cb) => onPostCtors.push(cb), "addOnPostCtor");
  var UTF8ToString = /* @__PURE__ */ __name((ptr, maxBytesToRead, ignoreNul) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : "", "UTF8ToString");
  var loadWebAssemblyModule = /* @__PURE__ */ __name((binary, flags, libName, localScope, handle) => {
    var metadata = getDylinkMetadata(binary);
    function loadModule() {
      var memAlign = Math.pow(2, metadata.memoryAlign);
      var memoryBase = metadata.memorySize ? alignMemory(getMemory(metadata.memorySize + memAlign), memAlign) : 0;
      var tableBase = metadata.tableSize ? wasmTable.length : 0;
      if (handle) {
        HEAP8[handle + 8] = 1;
        LE_HEAP_STORE_U32((handle + 12 >> 2) * 4, memoryBase);
        LE_HEAP_STORE_I32((handle + 16 >> 2) * 4, metadata.memorySize);
        LE_HEAP_STORE_U32((handle + 20 >> 2) * 4, tableBase);
        LE_HEAP_STORE_I32((handle + 24 >> 2) * 4, metadata.tableSize);
      }
      if (metadata.tableSize) {
        wasmTable.grow(metadata.tableSize);
      }
      var moduleExports;
      function resolveSymbol(sym) {
        var resolved = resolveGlobalSymbol(sym).sym;
        if (!resolved && localScope) {
          resolved = localScope[sym];
        }
        if (!resolved) {
          resolved = moduleExports[sym];
        }
        return resolved;
      }
      __name(resolveSymbol, "resolveSymbol");
      var proxyHandler = {
        get(stubs, prop) {
          switch (prop) {
            case "__memory_base":
              return memoryBase;
            case "__table_base":
              return tableBase;
          }
          if (prop in wasmImports && !wasmImports[prop].stub) {
            var res = wasmImports[prop];
            return res;
          }
          if (!(prop in stubs)) {
            var resolved;
            stubs[prop] = (...args2) => {
              resolved ||= resolveSymbol(prop);
              return resolved(...args2);
            };
          }
          return stubs[prop];
        }
      };
      var proxy = new Proxy({}, proxyHandler);
      currentModuleWeakSymbols = metadata.weakImports;
      var info = {
        "GOT.mem": new Proxy({}, GOTHandler),
        "GOT.func": new Proxy({}, GOTHandler),
        "env": proxy,
        "wasi_snapshot_preview1": proxy
      };
      function postInstantiation(module, instance) {
        updateTableMap(tableBase, metadata.tableSize);
        moduleExports = relocateExports(instance.exports, memoryBase);
        if (!flags.allowUndefined) {
          reportUndefinedSymbols();
        }
        function addEmAsm(addr, body) {
          var args = [];
          var arity = 0;
          for (; arity < 16; arity++) {
            if (body.indexOf("$" + arity) != -1) {
              args.push("$" + arity);
            } else {
              break;
            }
          }
          args = args.join(",");
          var func = `(${args}) => { ${body} };`;
          ASM_CONSTS[start] = eval(func);
        }
        __name(addEmAsm, "addEmAsm");
        if ("__start_em_asm" in moduleExports) {
          var start = moduleExports["__start_em_asm"];
          var stop = moduleExports["__stop_em_asm"];
          while (start < stop) {
            var jsString = UTF8ToString(start);
            addEmAsm(start, jsString);
            start = HEAPU8.indexOf(0, start) + 1;
          }
        }
        function addEmJs(name, cSig, body) {
          var jsArgs = [];
          cSig = cSig.slice(1, -1);
          if (cSig != "void") {
            cSig = cSig.split(",");
            for (var i in cSig) {
              var jsArg = cSig[i].split(" ").pop();
              jsArgs.push(jsArg.replace("*", ""));
            }
          }
          var func = `(${jsArgs}) => ${body};`;
          moduleExports[name] = eval(func);
        }
        __name(addEmJs, "addEmJs");
        for (var name in moduleExports) {
          if (name.startsWith("__em_js__")) {
            var start = moduleExports[name];
            var jsString = UTF8ToString(start);
            var parts = jsString.split("<::>");
            addEmJs(name.replace("__em_js__", ""), parts[0], parts[1]);
            delete moduleExports[name];
          }
        }
        var applyRelocs = moduleExports["__wasm_apply_data_relocs"];
        if (applyRelocs) {
          if (runtimeInitialized) {
            applyRelocs();
          } else {
            __RELOC_FUNCS__.push(applyRelocs);
          }
        }
        var init = moduleExports["__wasm_call_ctors"];
        if (init) {
          if (runtimeInitialized) {
            init();
          } else {
            addOnPostCtor(init);
          }
        }
        return moduleExports;
      }
      __name(postInstantiation, "postInstantiation");
      if (flags.loadAsync) {
        return (async () => {
          var instance2;
          if (binary instanceof WebAssembly.Module) {
            instance2 = new WebAssembly.Instance(binary, info);
          } else {
            ({ module: binary, instance: instance2 } = await WebAssembly.instantiate(binary, info));
          }
          return postInstantiation(binary, instance2);
        })();
      }
      var module = binary instanceof WebAssembly.Module ? binary : new WebAssembly.Module(binary);
      var instance = new WebAssembly.Instance(module, info);
      return postInstantiation(module, instance);
    }
    __name(loadModule, "loadModule");
    flags = {
      ...flags,
      rpath: {
        parentLibPath: libName,
        paths: metadata.runtimePaths
      }
    };
    if (flags.loadAsync) {
      return metadata.neededDynlibs.reduce((chain, dynNeeded) => chain.then(() => loadDynamicLibrary(dynNeeded, flags, localScope)), Promise.resolve()).then(loadModule);
    }
    metadata.neededDynlibs.forEach((needed) => loadDynamicLibrary(needed, flags, localScope));
    return loadModule();
  }, "loadWebAssemblyModule");
  var mergeLibSymbols = /* @__PURE__ */ __name((exports2, libName2) => {
    for (var [sym, exp] of Object.entries(exports2)) {
      const setImport = /* @__PURE__ */ __name((target) => {
        if (!isSymbolDefined(target)) {
          wasmImports[target] = exp;
        }
      }, "setImport");
      setImport(sym);
      const main_alias = "__main_argc_argv";
      if (sym == "main") {
        setImport(main_alias);
      }
      if (sym == main_alias) {
        setImport("main");
      }
    }
  }, "mergeLibSymbols");
  var asyncLoad = /* @__PURE__ */ __name(async (url) => {
    var arrayBuffer = await readAsync(url);
    return new Uint8Array(arrayBuffer);
  }, "asyncLoad");
  function loadDynamicLibrary(libName2, flags2 = {
    global: true,
    nodelete: true
  }, localScope2, handle2) {
    var dso = LDSO.loadedLibsByName[libName2];
    if (dso) {
      if (!flags2.global) {
        if (localScope2) {
          Object.assign(localScope2, dso.exports);
        }
      } else if (!dso.global) {
        dso.global = true;
        mergeLibSymbols(dso.exports, libName2);
      }
      if (flags2.nodelete && dso.refcount !== Infinity) {
        dso.refcount = Infinity;
      }
      dso.refcount++;
      if (handle2) {
        LDSO.loadedLibsByHandle[handle2] = dso;
      }
      return flags2.loadAsync ? Promise.resolve(true) : true;
    }
    dso = newDSO(libName2, handle2, "loading");
    dso.refcount = flags2.nodelete ? Infinity : 1;
    dso.global = flags2.global;
    function loadLibData() {
      if (handle2) {
        var data = LE_HEAP_LOAD_U32((handle2 + 28 >> 2) * 4);
        var dataSize = LE_HEAP_LOAD_U32((handle2 + 32 >> 2) * 4);
        if (data && dataSize) {
          var libData = HEAP8.slice(data, data + dataSize);
          return flags2.loadAsync ? Promise.resolve(libData) : libData;
        }
      }
      var libFile = locateFile(libName2);
      if (flags2.loadAsync) {
        return asyncLoad(libFile);
      }
      if (!readBinary) {
        throw new Error(`${libFile}: file not found, and synchronous loading of external files is not available`);
      }
      return readBinary(libFile);
    }
    __name(loadLibData, "loadLibData");
    function getExports() {
      if (flags2.loadAsync) {
        return loadLibData().then((libData) => loadWebAssemblyModule(libData, flags2, libName2, localScope2, handle2));
      }
      return loadWebAssemblyModule(loadLibData(), flags2, libName2, localScope2, handle2);
    }
    __name(getExports, "getExports");
    function moduleLoaded(exports2) {
      if (dso.global) {
        mergeLibSymbols(exports2, libName2);
      } else if (localScope2) {
        Object.assign(localScope2, exports2);
      }
      dso.exports = exports2;
    }
    __name(moduleLoaded, "moduleLoaded");
    if (flags2.loadAsync) {
      return getExports().then((exports2) => {
        moduleLoaded(exports2);
        return true;
      });
    }
    moduleLoaded(getExports());
    return true;
  }
  __name(loadDynamicLibrary, "loadDynamicLibrary");
  var reportUndefinedSymbols = /* @__PURE__ */ __name(() => {
    for (var [symName, entry] of Object.entries(GOT)) {
      if (entry.value == 0) {
        var value = resolveGlobalSymbol(symName, true).sym;
        if (!value && !entry.required) {
          continue;
        }
        if (typeof value == "function") {
          entry.value = addFunction(value, value.sig);
        } else if (typeof value == "number") {
          entry.value = value;
        } else {
          throw new Error(`bad export type for '${symName}': ${typeof value}`);
        }
      }
    }
  }, "reportUndefinedSymbols");
  var runDependencies = 0;
  var dependenciesFulfilled = null;
  var removeRunDependency = /* @__PURE__ */ __name((id) => {
    runDependencies--;
    Module["monitorRunDependencies"]?.(runDependencies);
    if (runDependencies == 0) {
      if (dependenciesFulfilled) {
        var callback = dependenciesFulfilled;
        dependenciesFulfilled = null;
        callback();
      }
    }
  }, "removeRunDependency");
  var addRunDependency = /* @__PURE__ */ __name((id) => {
    runDependencies++;
    Module["monitorRunDependencies"]?.(runDependencies);
  }, "addRunDependency");
  var loadDylibs = /* @__PURE__ */ __name(async () => {
    if (!dynamicLibraries.length) {
      reportUndefinedSymbols();
      return;
    }
    addRunDependency("loadDylibs");
    for (var lib of dynamicLibraries) {
      await loadDynamicLibrary(lib, {
        loadAsync: true,
        global: true,
        nodelete: true,
        allowUndefined: true
      });
    }
    reportUndefinedSymbols();
    removeRunDependency("loadDylibs");
  }, "loadDylibs");
  var noExitRuntime = true;
  function setValue(ptr, value, type = "i8") {
    if (type.endsWith("*")) type = "*";
    switch (type) {
      case "i1":
        HEAP8[ptr] = value;
        break;
      case "i8":
        HEAP8[ptr] = value;
        break;
      case "i16":
        LE_HEAP_STORE_I16((ptr >> 1) * 2, value);
        break;
      case "i32":
        LE_HEAP_STORE_I32((ptr >> 2) * 4, value);
        break;
      case "i64":
        LE_HEAP_STORE_I64((ptr >> 3) * 8, BigInt(value));
        break;
      case "float":
        LE_HEAP_STORE_F32((ptr >> 2) * 4, value);
        break;
      case "double":
        LE_HEAP_STORE_F64((ptr >> 3) * 8, value);
        break;
      case "*":
        LE_HEAP_STORE_U32((ptr >> 2) * 4, value);
        break;
      default:
        abort(`invalid type for setValue: ${type}`);
    }
  }
  __name(setValue, "setValue");
  var ___memory_base = new WebAssembly.Global({
    "value": "i32",
    "mutable": false
  }, 1024);
  var ___stack_high = 78240;
  var ___stack_low = 12704;
  var ___stack_pointer = new WebAssembly.Global({
    "value": "i32",
    "mutable": true
  }, 78240);
  var ___table_base = new WebAssembly.Global({
    "value": "i32",
    "mutable": false
  }, 1);
  var __abort_js = /* @__PURE__ */ __name(() => abort(""), "__abort_js");
  __abort_js.sig = "v";
  var getHeapMax = /* @__PURE__ */ __name(() => (
    // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
    // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
    // for any code that deals with heap sizes, which would require special
    // casing all heap size related code to treat 0 specially.
    2147483648
  ), "getHeapMax");
  var growMemory = /* @__PURE__ */ __name((size) => {
    var oldHeapSize = wasmMemory.buffer.byteLength;
    var pages = (size - oldHeapSize + 65535) / 65536 | 0;
    try {
      wasmMemory.grow(pages);
      updateMemoryViews();
      return 1;
    } catch (e) {
    }
  }, "growMemory");
  var _emscripten_resize_heap = /* @__PURE__ */ __name((requestedSize) => {
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
      return false;
    }
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
      var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
      overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
      var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
      var replacement = growMemory(newSize);
      if (replacement) {
        return true;
      }
    }
    return false;
  }, "_emscripten_resize_heap");
  _emscripten_resize_heap.sig = "ip";
  var _fd_close = /* @__PURE__ */ __name((fd) => 52, "_fd_close");
  _fd_close.sig = "ii";
  var INT53_MAX = 9007199254740992;
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = /* @__PURE__ */ __name((num) => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num), "bigintToI53Checked");
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
    return 70;
  }
  __name(_fd_seek, "_fd_seek");
  _fd_seek.sig = "iijip";
  var printCharBuffers = [null, [], []];
  var printChar = /* @__PURE__ */ __name((stream, curr) => {
    var buffer = printCharBuffers[stream];
    if (curr === 0 || curr === 10) {
      (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
      buffer.length = 0;
    } else {
      buffer.push(curr);
    }
  }, "printChar");
  var _fd_write = /* @__PURE__ */ __name((fd, iov, iovcnt, pnum) => {
    var num = 0;
    for (var i2 = 0; i2 < iovcnt; i2++) {
      var ptr = LE_HEAP_LOAD_U32((iov >> 2) * 4);
      var len = LE_HEAP_LOAD_U32((iov + 4 >> 2) * 4);
      iov += 8;
      for (var j = 0; j < len; j++) {
        printChar(fd, HEAPU8[ptr + j]);
      }
      num += len;
    }
    LE_HEAP_STORE_U32((pnum >> 2) * 4, num);
    return 0;
  }, "_fd_write");
  _fd_write.sig = "iippp";
  function _tree_sitter_log_callback(isLexMessage, messageAddress) {
    if (Module.currentLogCallback) {
      const message = UTF8ToString(messageAddress);
      Module.currentLogCallback(message, isLexMessage !== 0);
    }
  }
  __name(_tree_sitter_log_callback, "_tree_sitter_log_callback");
  function _tree_sitter_parse_callback(inputBufferAddress, index, row, column, lengthAddress) {
    const INPUT_BUFFER_SIZE = 10 * 1024;
    const string = Module.currentParseCallback(index, {
      row,
      column
    });
    if (typeof string === "string") {
      setValue(lengthAddress, string.length, "i32");
      stringToUTF16(string, inputBufferAddress, INPUT_BUFFER_SIZE);
    } else {
      setValue(lengthAddress, 0, "i32");
    }
  }
  __name(_tree_sitter_parse_callback, "_tree_sitter_parse_callback");
  function _tree_sitter_progress_callback(currentOffset, hasError) {
    if (Module.currentProgressCallback) {
      return Module.currentProgressCallback({
        currentOffset,
        hasError
      });
    }
    return false;
  }
  __name(_tree_sitter_progress_callback, "_tree_sitter_progress_callback");
  function _tree_sitter_query_progress_callback(currentOffset) {
    if (Module.currentQueryProgressCallback) {
      return Module.currentQueryProgressCallback({
        currentOffset
      });
    }
    return false;
  }
  __name(_tree_sitter_query_progress_callback, "_tree_sitter_query_progress_callback");
  var runtimeKeepaliveCounter = 0;
  var keepRuntimeAlive = /* @__PURE__ */ __name(() => noExitRuntime || runtimeKeepaliveCounter > 0, "keepRuntimeAlive");
  var _proc_exit = /* @__PURE__ */ __name((code) => {
    EXITSTATUS = code;
    if (!keepRuntimeAlive()) {
      Module["onExit"]?.(code);
      ABORT = true;
    }
    quit_(code, new ExitStatus(code));
  }, "_proc_exit");
  _proc_exit.sig = "vi";
  var exitJS = /* @__PURE__ */ __name((status, implicit) => {
    EXITSTATUS = status;
    _proc_exit(status);
  }, "exitJS");
  var handleException = /* @__PURE__ */ __name((e) => {
    if (e instanceof ExitStatus || e == "unwind") {
      return EXITSTATUS;
    }
    quit_(1, e);
  }, "handleException");
  var lengthBytesUTF8 = /* @__PURE__ */ __name((str) => {
    var len = 0;
    for (var i2 = 0; i2 < str.length; ++i2) {
      var c = str.charCodeAt(i2);
      if (c <= 127) {
        len++;
      } else if (c <= 2047) {
        len += 2;
      } else if (c >= 55296 && c <= 57343) {
        len += 4;
        ++i2;
      } else {
        len += 3;
      }
    }
    return len;
  }, "lengthBytesUTF8");
  var stringToUTF8Array = /* @__PURE__ */ __name((str, heap, outIdx, maxBytesToWrite) => {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i2 = 0; i2 < str.length; ++i2) {
      var u = str.codePointAt(i2);
      if (u <= 127) {
        if (outIdx >= endIdx) break;
        heap[outIdx++] = u;
      } else if (u <= 2047) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++] = 192 | u >> 6;
        heap[outIdx++] = 128 | u & 63;
      } else if (u <= 65535) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++] = 224 | u >> 12;
        heap[outIdx++] = 128 | u >> 6 & 63;
        heap[outIdx++] = 128 | u & 63;
      } else {
        if (outIdx + 3 >= endIdx) break;
        heap[outIdx++] = 240 | u >> 18;
        heap[outIdx++] = 128 | u >> 12 & 63;
        heap[outIdx++] = 128 | u >> 6 & 63;
        heap[outIdx++] = 128 | u & 63;
        i2++;
      }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx;
  }, "stringToUTF8Array");
  var stringToUTF8 = /* @__PURE__ */ __name((str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite), "stringToUTF8");
  var stackAlloc = /* @__PURE__ */ __name((sz) => __emscripten_stack_alloc(sz), "stackAlloc");
  var stringToUTF8OnStack = /* @__PURE__ */ __name((str) => {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8(str, ret, size);
    return ret;
  }, "stringToUTF8OnStack");
  var AsciiToString = /* @__PURE__ */ __name((ptr) => {
    var str = "";
    while (1) {
      var ch = HEAPU8[ptr++];
      if (!ch) return str;
      str += String.fromCharCode(ch);
    }
  }, "AsciiToString");
  var stringToUTF16 = /* @__PURE__ */ __name((str, outPtr, maxBytesToWrite) => {
    maxBytesToWrite ??= 2147483647;
    if (maxBytesToWrite < 2) return 0;
    maxBytesToWrite -= 2;
    var startPtr = outPtr;
    var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
    for (var i2 = 0; i2 < numCharsToWrite; ++i2) {
      var codeUnit = str.charCodeAt(i2);
      LE_HEAP_STORE_I16((outPtr >> 1) * 2, codeUnit);
      outPtr += 2;
    }
    LE_HEAP_STORE_I16((outPtr >> 1) * 2, 0);
    return outPtr - startPtr;
  }, "stringToUTF16");
  LE_ATOMICS_NATIVE_BYTE_ORDER = new Int8Array(new Int16Array([1]).buffer)[0] === 1 ? [
    /* little endian */
    ((x) => x),
    ((x) => x),
    void 0,
    ((x) => x)
  ] : [
    /* big endian */
    ((x) => x),
    ((x) => ((x & 65280) << 8 | (x & 255) << 24) >> 16),
    void 0,
    ((x) => x >> 24 & 255 | x >> 8 & 65280 | (x & 65280) << 8 | (x & 255) << 24)
  ];
  function LE_HEAP_UPDATE() {
    HEAPU16.unsigned = ((x) => x & 65535);
    HEAPU32.unsigned = ((x) => x >>> 0);
  }
  __name(LE_HEAP_UPDATE, "LE_HEAP_UPDATE");
  {
    initMemory();
    if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
    if (Module["print"]) out = Module["print"];
    if (Module["printErr"]) err = Module["printErr"];
    if (Module["dynamicLibraries"]) dynamicLibraries = Module["dynamicLibraries"];
    if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
    if (Module["arguments"]) arguments_ = Module["arguments"];
    if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
    if (Module["preInit"]) {
      if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
      while (Module["preInit"].length > 0) {
        Module["preInit"].shift()();
      }
    }
  }
  Module["setValue"] = setValue;
  Module["getValue"] = getValue;
  Module["UTF8ToString"] = UTF8ToString;
  Module["stringToUTF8"] = stringToUTF8;
  Module["lengthBytesUTF8"] = lengthBytesUTF8;
  Module["AsciiToString"] = AsciiToString;
  Module["stringToUTF16"] = stringToUTF16;
  Module["loadWebAssemblyModule"] = loadWebAssemblyModule;
  Module["LE_HEAP_STORE_I64"] = LE_HEAP_STORE_I64;
  var ASM_CONSTS = {};
  var _malloc, _calloc, _realloc, _free, _ts_range_edit, _memcmp, _ts_language_symbol_count, _ts_language_state_count, _ts_language_abi_version, _ts_language_name, _ts_language_field_count, _ts_language_next_state, _ts_language_symbol_name, _ts_language_symbol_for_name, _strncmp, _ts_language_symbol_type, _ts_language_field_name_for_id, _ts_lookahead_iterator_new, _ts_lookahead_iterator_delete, _ts_lookahead_iterator_reset_state, _ts_lookahead_iterator_reset, _ts_lookahead_iterator_next, _ts_lookahead_iterator_current_symbol, _ts_point_edit, _ts_parser_delete, _ts_parser_reset, _ts_parser_set_language, _ts_parser_set_included_ranges, _ts_query_new, _ts_query_delete, _iswspace, _iswalnum, _ts_query_pattern_count, _ts_query_capture_count, _ts_query_string_count, _ts_query_capture_name_for_id, _ts_query_capture_quantifier_for_id, _ts_query_string_value_for_id, _ts_query_predicates_for_pattern, _ts_query_start_byte_for_pattern, _ts_query_end_byte_for_pattern, _ts_query_is_pattern_rooted, _ts_query_is_pattern_non_local, _ts_query_is_pattern_guaranteed_at_step, _ts_query_disable_capture, _ts_query_disable_pattern, _ts_tree_copy, _ts_tree_delete, _ts_init, _ts_parser_new_wasm, _ts_parser_enable_logger_wasm, _ts_parser_parse_wasm, _ts_parser_included_ranges_wasm, _ts_language_type_is_named_wasm, _ts_language_type_is_visible_wasm, _ts_language_metadata_wasm, _ts_language_supertypes_wasm, _ts_language_subtypes_wasm, _ts_tree_root_node_wasm, _ts_tree_root_node_with_offset_wasm, _ts_tree_edit_wasm, _ts_tree_included_ranges_wasm, _ts_tree_get_changed_ranges_wasm, _ts_tree_cursor_new_wasm, _ts_tree_cursor_copy_wasm, _ts_tree_cursor_delete_wasm, _ts_tree_cursor_reset_wasm, _ts_tree_cursor_reset_to_wasm, _ts_tree_cursor_goto_first_child_wasm, _ts_tree_cursor_goto_last_child_wasm, _ts_tree_cursor_goto_first_child_for_index_wasm, _ts_tree_cursor_goto_first_child_for_position_wasm, _ts_tree_cursor_goto_next_sibling_wasm, _ts_tree_cursor_goto_previous_sibling_wasm, _ts_tree_cursor_goto_descendant_wasm, _ts_tree_cursor_goto_parent_wasm, _ts_tree_cursor_current_node_type_id_wasm, _ts_tree_cursor_current_node_state_id_wasm, _ts_tree_cursor_current_node_is_named_wasm, _ts_tree_cursor_current_node_is_missing_wasm, _ts_tree_cursor_current_node_id_wasm, _ts_tree_cursor_start_position_wasm, _ts_tree_cursor_end_position_wasm, _ts_tree_cursor_start_index_wasm, _ts_tree_cursor_end_index_wasm, _ts_tree_cursor_current_field_id_wasm, _ts_tree_cursor_current_depth_wasm, _ts_tree_cursor_current_descendant_index_wasm, _ts_tree_cursor_current_node_wasm, _ts_node_symbol_wasm, _ts_node_field_name_for_child_wasm, _ts_node_field_name_for_named_child_wasm, _ts_node_children_by_field_id_wasm, _ts_node_first_child_for_byte_wasm, _ts_node_first_named_child_for_byte_wasm, _ts_node_grammar_symbol_wasm, _ts_node_child_count_wasm, _ts_node_named_child_count_wasm, _ts_node_child_wasm, _ts_node_named_child_wasm, _ts_node_child_by_field_id_wasm, _ts_node_next_sibling_wasm, _ts_node_prev_sibling_wasm, _ts_node_next_named_sibling_wasm, _ts_node_prev_named_sibling_wasm, _ts_node_descendant_count_wasm, _ts_node_parent_wasm, _ts_node_child_with_descendant_wasm, _ts_node_descendant_for_index_wasm, _ts_node_named_descendant_for_index_wasm, _ts_node_descendant_for_position_wasm, _ts_node_named_descendant_for_position_wasm, _ts_node_start_point_wasm, _ts_node_end_point_wasm, _ts_node_start_index_wasm, _ts_node_end_index_wasm, _ts_node_to_string_wasm, _ts_node_children_wasm, _ts_node_named_children_wasm, _ts_node_descendants_of_type_wasm, _ts_node_is_named_wasm, _ts_node_has_changes_wasm, _ts_node_has_error_wasm, _ts_node_is_error_wasm, _ts_node_is_missing_wasm, _ts_node_is_extra_wasm, _ts_node_parse_state_wasm, _ts_node_next_parse_state_wasm, _ts_query_matches_wasm, _ts_query_captures_wasm, _memset, _memcpy, _memmove, _iswalpha, _iswblank, _iswdigit, _iswlower, _iswupper, _iswxdigit, _memchr, _strlen, _strcmp, _strncat, _strncpy, _towlower, _towupper, _setThrew, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, ___wasm_apply_data_relocs;
  function assignWasmExports(wasmExports2) {
    Module["_malloc"] = _malloc = wasmExports2["malloc"];
    Module["_calloc"] = _calloc = wasmExports2["calloc"];
    Module["_realloc"] = _realloc = wasmExports2["realloc"];
    Module["_free"] = _free = wasmExports2["free"];
    Module["_ts_range_edit"] = _ts_range_edit = wasmExports2["ts_range_edit"];
    Module["_memcmp"] = _memcmp = wasmExports2["memcmp"];
    Module["_ts_language_symbol_count"] = _ts_language_symbol_count = wasmExports2["ts_language_symbol_count"];
    Module["_ts_language_state_count"] = _ts_language_state_count = wasmExports2["ts_language_state_count"];
    Module["_ts_language_abi_version"] = _ts_language_abi_version = wasmExports2["ts_language_abi_version"];
    Module["_ts_language_name"] = _ts_language_name = wasmExports2["ts_language_name"];
    Module["_ts_language_field_count"] = _ts_language_field_count = wasmExports2["ts_language_field_count"];
    Module["_ts_language_next_state"] = _ts_language_next_state = wasmExports2["ts_language_next_state"];
    Module["_ts_language_symbol_name"] = _ts_language_symbol_name = wasmExports2["ts_language_symbol_name"];
    Module["_ts_language_symbol_for_name"] = _ts_language_symbol_for_name = wasmExports2["ts_language_symbol_for_name"];
    Module["_strncmp"] = _strncmp = wasmExports2["strncmp"];
    Module["_ts_language_symbol_type"] = _ts_language_symbol_type = wasmExports2["ts_language_symbol_type"];
    Module["_ts_language_field_name_for_id"] = _ts_language_field_name_for_id = wasmExports2["ts_language_field_name_for_id"];
    Module["_ts_lookahead_iterator_new"] = _ts_lookahead_iterator_new = wasmExports2["ts_lookahead_iterator_new"];
    Module["_ts_lookahead_iterator_delete"] = _ts_lookahead_iterator_delete = wasmExports2["ts_lookahead_iterator_delete"];
    Module["_ts_lookahead_iterator_reset_state"] = _ts_lookahead_iterator_reset_state = wasmExports2["ts_lookahead_iterator_reset_state"];
    Module["_ts_lookahead_iterator_reset"] = _ts_lookahead_iterator_reset = wasmExports2["ts_lookahead_iterator_reset"];
    Module["_ts_lookahead_iterator_next"] = _ts_lookahead_iterator_next = wasmExports2["ts_lookahead_iterator_next"];
    Module["_ts_lookahead_iterator_current_symbol"] = _ts_lookahead_iterator_current_symbol = wasmExports2["ts_lookahead_iterator_current_symbol"];
    Module["_ts_point_edit"] = _ts_point_edit = wasmExports2["ts_point_edit"];
    Module["_ts_parser_delete"] = _ts_parser_delete = wasmExports2["ts_parser_delete"];
    Module["_ts_parser_reset"] = _ts_parser_reset = wasmExports2["ts_parser_reset"];
    Module["_ts_parser_set_language"] = _ts_parser_set_language = wasmExports2["ts_parser_set_language"];
    Module["_ts_parser_set_included_ranges"] = _ts_parser_set_included_ranges = wasmExports2["ts_parser_set_included_ranges"];
    Module["_ts_query_new"] = _ts_query_new = wasmExports2["ts_query_new"];
    Module["_ts_query_delete"] = _ts_query_delete = wasmExports2["ts_query_delete"];
    Module["_iswspace"] = _iswspace = wasmExports2["iswspace"];
    Module["_iswalnum"] = _iswalnum = wasmExports2["iswalnum"];
    Module["_ts_query_pattern_count"] = _ts_query_pattern_count = wasmExports2["ts_query_pattern_count"];
    Module["_ts_query_capture_count"] = _ts_query_capture_count = wasmExports2["ts_query_capture_count"];
    Module["_ts_query_string_count"] = _ts_query_string_count = wasmExports2["ts_query_string_count"];
    Module["_ts_query_capture_name_for_id"] = _ts_query_capture_name_for_id = wasmExports2["ts_query_capture_name_for_id"];
    Module["_ts_query_capture_quantifier_for_id"] = _ts_query_capture_quantifier_for_id = wasmExports2["ts_query_capture_quantifier_for_id"];
    Module["_ts_query_string_value_for_id"] = _ts_query_string_value_for_id = wasmExports2["ts_query_string_value_for_id"];
    Module["_ts_query_predicates_for_pattern"] = _ts_query_predicates_for_pattern = wasmExports2["ts_query_predicates_for_pattern"];
    Module["_ts_query_start_byte_for_pattern"] = _ts_query_start_byte_for_pattern = wasmExports2["ts_query_start_byte_for_pattern"];
    Module["_ts_query_end_byte_for_pattern"] = _ts_query_end_byte_for_pattern = wasmExports2["ts_query_end_byte_for_pattern"];
    Module["_ts_query_is_pattern_rooted"] = _ts_query_is_pattern_rooted = wasmExports2["ts_query_is_pattern_rooted"];
    Module["_ts_query_is_pattern_non_local"] = _ts_query_is_pattern_non_local = wasmExports2["ts_query_is_pattern_non_local"];
    Module["_ts_query_is_pattern_guaranteed_at_step"] = _ts_query_is_pattern_guaranteed_at_step = wasmExports2["ts_query_is_pattern_guaranteed_at_step"];
    Module["_ts_query_disable_capture"] = _ts_query_disable_capture = wasmExports2["ts_query_disable_capture"];
    Module["_ts_query_disable_pattern"] = _ts_query_disable_pattern = wasmExports2["ts_query_disable_pattern"];
    Module["_ts_tree_copy"] = _ts_tree_copy = wasmExports2["ts_tree_copy"];
    Module["_ts_tree_delete"] = _ts_tree_delete = wasmExports2["ts_tree_delete"];
    Module["_ts_init"] = _ts_init = wasmExports2["ts_init"];
    Module["_ts_parser_new_wasm"] = _ts_parser_new_wasm = wasmExports2["ts_parser_new_wasm"];
    Module["_ts_parser_enable_logger_wasm"] = _ts_parser_enable_logger_wasm = wasmExports2["ts_parser_enable_logger_wasm"];
    Module["_ts_parser_parse_wasm"] = _ts_parser_parse_wasm = wasmExports2["ts_parser_parse_wasm"];
    Module["_ts_parser_included_ranges_wasm"] = _ts_parser_included_ranges_wasm = wasmExports2["ts_parser_included_ranges_wasm"];
    Module["_ts_language_type_is_named_wasm"] = _ts_language_type_is_named_wasm = wasmExports2["ts_language_type_is_named_wasm"];
    Module["_ts_language_type_is_visible_wasm"] = _ts_language_type_is_visible_wasm = wasmExports2["ts_language_type_is_visible_wasm"];
    Module["_ts_language_metadata_wasm"] = _ts_language_metadata_wasm = wasmExports2["ts_language_metadata_wasm"];
    Module["_ts_language_supertypes_wasm"] = _ts_language_supertypes_wasm = wasmExports2["ts_language_supertypes_wasm"];
    Module["_ts_language_subtypes_wasm"] = _ts_language_subtypes_wasm = wasmExports2["ts_language_subtypes_wasm"];
    Module["_ts_tree_root_node_wasm"] = _ts_tree_root_node_wasm = wasmExports2["ts_tree_root_node_wasm"];
    Module["_ts_tree_root_node_with_offset_wasm"] = _ts_tree_root_node_with_offset_wasm = wasmExports2["ts_tree_root_node_with_offset_wasm"];
    Module["_ts_tree_edit_wasm"] = _ts_tree_edit_wasm = wasmExports2["ts_tree_edit_wasm"];
    Module["_ts_tree_included_ranges_wasm"] = _ts_tree_included_ranges_wasm = wasmExports2["ts_tree_included_ranges_wasm"];
    Module["_ts_tree_get_changed_ranges_wasm"] = _ts_tree_get_changed_ranges_wasm = wasmExports2["ts_tree_get_changed_ranges_wasm"];
    Module["_ts_tree_cursor_new_wasm"] = _ts_tree_cursor_new_wasm = wasmExports2["ts_tree_cursor_new_wasm"];
    Module["_ts_tree_cursor_copy_wasm"] = _ts_tree_cursor_copy_wasm = wasmExports2["ts_tree_cursor_copy_wasm"];
    Module["_ts_tree_cursor_delete_wasm"] = _ts_tree_cursor_delete_wasm = wasmExports2["ts_tree_cursor_delete_wasm"];
    Module["_ts_tree_cursor_reset_wasm"] = _ts_tree_cursor_reset_wasm = wasmExports2["ts_tree_cursor_reset_wasm"];
    Module["_ts_tree_cursor_reset_to_wasm"] = _ts_tree_cursor_reset_to_wasm = wasmExports2["ts_tree_cursor_reset_to_wasm"];
    Module["_ts_tree_cursor_goto_first_child_wasm"] = _ts_tree_cursor_goto_first_child_wasm = wasmExports2["ts_tree_cursor_goto_first_child_wasm"];
    Module["_ts_tree_cursor_goto_last_child_wasm"] = _ts_tree_cursor_goto_last_child_wasm = wasmExports2["ts_tree_cursor_goto_last_child_wasm"];
    Module["_ts_tree_cursor_goto_first_child_for_index_wasm"] = _ts_tree_cursor_goto_first_child_for_index_wasm = wasmExports2["ts_tree_cursor_goto_first_child_for_index_wasm"];
    Module["_ts_tree_cursor_goto_first_child_for_position_wasm"] = _ts_tree_cursor_goto_first_child_for_position_wasm = wasmExports2["ts_tree_cursor_goto_first_child_for_position_wasm"];
    Module["_ts_tree_cursor_goto_next_sibling_wasm"] = _ts_tree_cursor_goto_next_sibling_wasm = wasmExports2["ts_tree_cursor_goto_next_sibling_wasm"];
    Module["_ts_tree_cursor_goto_previous_sibling_wasm"] = _ts_tree_cursor_goto_previous_sibling_wasm = wasmExports2["ts_tree_cursor_goto_previous_sibling_wasm"];
    Module["_ts_tree_cursor_goto_descendant_wasm"] = _ts_tree_cursor_goto_descendant_wasm = wasmExports2["ts_tree_cursor_goto_descendant_wasm"];
    Module["_ts_tree_cursor_goto_parent_wasm"] = _ts_tree_cursor_goto_parent_wasm = wasmExports2["ts_tree_cursor_goto_parent_wasm"];
    Module["_ts_tree_cursor_current_node_type_id_wasm"] = _ts_tree_cursor_current_node_type_id_wasm = wasmExports2["ts_tree_cursor_current_node_type_id_wasm"];
    Module["_ts_tree_cursor_current_node_state_id_wasm"] = _ts_tree_cursor_current_node_state_id_wasm = wasmExports2["ts_tree_cursor_current_node_state_id_wasm"];
    Module["_ts_tree_cursor_current_node_is_named_wasm"] = _ts_tree_cursor_current_node_is_named_wasm = wasmExports2["ts_tree_cursor_current_node_is_named_wasm"];
    Module["_ts_tree_cursor_current_node_is_missing_wasm"] = _ts_tree_cursor_current_node_is_missing_wasm = wasmExports2["ts_tree_cursor_current_node_is_missing_wasm"];
    Module["_ts_tree_cursor_current_node_id_wasm"] = _ts_tree_cursor_current_node_id_wasm = wasmExports2["ts_tree_cursor_current_node_id_wasm"];
    Module["_ts_tree_cursor_start_position_wasm"] = _ts_tree_cursor_start_position_wasm = wasmExports2["ts_tree_cursor_start_position_wasm"];
    Module["_ts_tree_cursor_end_position_wasm"] = _ts_tree_cursor_end_position_wasm = wasmExports2["ts_tree_cursor_end_position_wasm"];
    Module["_ts_tree_cursor_start_index_wasm"] = _ts_tree_cursor_start_index_wasm = wasmExports2["ts_tree_cursor_start_index_wasm"];
    Module["_ts_tree_cursor_end_index_wasm"] = _ts_tree_cursor_end_index_wasm = wasmExports2["ts_tree_cursor_end_index_wasm"];
    Module["_ts_tree_cursor_current_field_id_wasm"] = _ts_tree_cursor_current_field_id_wasm = wasmExports2["ts_tree_cursor_current_field_id_wasm"];
    Module["_ts_tree_cursor_current_depth_wasm"] = _ts_tree_cursor_current_depth_wasm = wasmExports2["ts_tree_cursor_current_depth_wasm"];
    Module["_ts_tree_cursor_current_descendant_index_wasm"] = _ts_tree_cursor_current_descendant_index_wasm = wasmExports2["ts_tree_cursor_current_descendant_index_wasm"];
    Module["_ts_tree_cursor_current_node_wasm"] = _ts_tree_cursor_current_node_wasm = wasmExports2["ts_tree_cursor_current_node_wasm"];
    Module["_ts_node_symbol_wasm"] = _ts_node_symbol_wasm = wasmExports2["ts_node_symbol_wasm"];
    Module["_ts_node_field_name_for_child_wasm"] = _ts_node_field_name_for_child_wasm = wasmExports2["ts_node_field_name_for_child_wasm"];
    Module["_ts_node_field_name_for_named_child_wasm"] = _ts_node_field_name_for_named_child_wasm = wasmExports2["ts_node_field_name_for_named_child_wasm"];
    Module["_ts_node_children_by_field_id_wasm"] = _ts_node_children_by_field_id_wasm = wasmExports2["ts_node_children_by_field_id_wasm"];
    Module["_ts_node_first_child_for_byte_wasm"] = _ts_node_first_child_for_byte_wasm = wasmExports2["ts_node_first_child_for_byte_wasm"];
    Module["_ts_node_first_named_child_for_byte_wasm"] = _ts_node_first_named_child_for_byte_wasm = wasmExports2["ts_node_first_named_child_for_byte_wasm"];
    Module["_ts_node_grammar_symbol_wasm"] = _ts_node_grammar_symbol_wasm = wasmExports2["ts_node_grammar_symbol_wasm"];
    Module["_ts_node_child_count_wasm"] = _ts_node_child_count_wasm = wasmExports2["ts_node_child_count_wasm"];
    Module["_ts_node_named_child_count_wasm"] = _ts_node_named_child_count_wasm = wasmExports2["ts_node_named_child_count_wasm"];
    Module["_ts_node_child_wasm"] = _ts_node_child_wasm = wasmExports2["ts_node_child_wasm"];
    Module["_ts_node_named_child_wasm"] = _ts_node_named_child_wasm = wasmExports2["ts_node_named_child_wasm"];
    Module["_ts_node_child_by_field_id_wasm"] = _ts_node_child_by_field_id_wasm = wasmExports2["ts_node_child_by_field_id_wasm"];
    Module["_ts_node_next_sibling_wasm"] = _ts_node_next_sibling_wasm = wasmExports2["ts_node_next_sibling_wasm"];
    Module["_ts_node_prev_sibling_wasm"] = _ts_node_prev_sibling_wasm = wasmExports2["ts_node_prev_sibling_wasm"];
    Module["_ts_node_next_named_sibling_wasm"] = _ts_node_next_named_sibling_wasm = wasmExports2["ts_node_next_named_sibling_wasm"];
    Module["_ts_node_prev_named_sibling_wasm"] = _ts_node_prev_named_sibling_wasm = wasmExports2["ts_node_prev_named_sibling_wasm"];
    Module["_ts_node_descendant_count_wasm"] = _ts_node_descendant_count_wasm = wasmExports2["ts_node_descendant_count_wasm"];
    Module["_ts_node_parent_wasm"] = _ts_node_parent_wasm = wasmExports2["ts_node_parent_wasm"];
    Module["_ts_node_child_with_descendant_wasm"] = _ts_node_child_with_descendant_wasm = wasmExports2["ts_node_child_with_descendant_wasm"];
    Module["_ts_node_descendant_for_index_wasm"] = _ts_node_descendant_for_index_wasm = wasmExports2["ts_node_descendant_for_index_wasm"];
    Module["_ts_node_named_descendant_for_index_wasm"] = _ts_node_named_descendant_for_index_wasm = wasmExports2["ts_node_named_descendant_for_index_wasm"];
    Module["_ts_node_descendant_for_position_wasm"] = _ts_node_descendant_for_position_wasm = wasmExports2["ts_node_descendant_for_position_wasm"];
    Module["_ts_node_named_descendant_for_position_wasm"] = _ts_node_named_descendant_for_position_wasm = wasmExports2["ts_node_named_descendant_for_position_wasm"];
    Module["_ts_node_start_point_wasm"] = _ts_node_start_point_wasm = wasmExports2["ts_node_start_point_wasm"];
    Module["_ts_node_end_point_wasm"] = _ts_node_end_point_wasm = wasmExports2["ts_node_end_point_wasm"];
    Module["_ts_node_start_index_wasm"] = _ts_node_start_index_wasm = wasmExports2["ts_node_start_index_wasm"];
    Module["_ts_node_end_index_wasm"] = _ts_node_end_index_wasm = wasmExports2["ts_node_end_index_wasm"];
    Module["_ts_node_to_string_wasm"] = _ts_node_to_string_wasm = wasmExports2["ts_node_to_string_wasm"];
    Module["_ts_node_children_wasm"] = _ts_node_children_wasm = wasmExports2["ts_node_children_wasm"];
    Module["_ts_node_named_children_wasm"] = _ts_node_named_children_wasm = wasmExports2["ts_node_named_children_wasm"];
    Module["_ts_node_descendants_of_type_wasm"] = _ts_node_descendants_of_type_wasm = wasmExports2["ts_node_descendants_of_type_wasm"];
    Module["_ts_node_is_named_wasm"] = _ts_node_is_named_wasm = wasmExports2["ts_node_is_named_wasm"];
    Module["_ts_node_has_changes_wasm"] = _ts_node_has_changes_wasm = wasmExports2["ts_node_has_changes_wasm"];
    Module["_ts_node_has_error_wasm"] = _ts_node_has_error_wasm = wasmExports2["ts_node_has_error_wasm"];
    Module["_ts_node_is_error_wasm"] = _ts_node_is_error_wasm = wasmExports2["ts_node_is_error_wasm"];
    Module["_ts_node_is_missing_wasm"] = _ts_node_is_missing_wasm = wasmExports2["ts_node_is_missing_wasm"];
    Module["_ts_node_is_extra_wasm"] = _ts_node_is_extra_wasm = wasmExports2["ts_node_is_extra_wasm"];
    Module["_ts_node_parse_state_wasm"] = _ts_node_parse_state_wasm = wasmExports2["ts_node_parse_state_wasm"];
    Module["_ts_node_next_parse_state_wasm"] = _ts_node_next_parse_state_wasm = wasmExports2["ts_node_next_parse_state_wasm"];
    Module["_ts_query_matches_wasm"] = _ts_query_matches_wasm = wasmExports2["ts_query_matches_wasm"];
    Module["_ts_query_captures_wasm"] = _ts_query_captures_wasm = wasmExports2["ts_query_captures_wasm"];
    Module["_memset"] = _memset = wasmExports2["memset"];
    Module["_memcpy"] = _memcpy = wasmExports2["memcpy"];
    Module["_memmove"] = _memmove = wasmExports2["memmove"];
    Module["_iswalpha"] = _iswalpha = wasmExports2["iswalpha"];
    Module["_iswblank"] = _iswblank = wasmExports2["iswblank"];
    Module["_iswdigit"] = _iswdigit = wasmExports2["iswdigit"];
    Module["_iswlower"] = _iswlower = wasmExports2["iswlower"];
    Module["_iswupper"] = _iswupper = wasmExports2["iswupper"];
    Module["_iswxdigit"] = _iswxdigit = wasmExports2["iswxdigit"];
    Module["_memchr"] = _memchr = wasmExports2["memchr"];
    Module["_strlen"] = _strlen = wasmExports2["strlen"];
    Module["_strcmp"] = _strcmp = wasmExports2["strcmp"];
    Module["_strncat"] = _strncat = wasmExports2["strncat"];
    Module["_strncpy"] = _strncpy = wasmExports2["strncpy"];
    Module["_towlower"] = _towlower = wasmExports2["towlower"];
    Module["_towupper"] = _towupper = wasmExports2["towupper"];
    _setThrew = wasmExports2["setThrew"];
    __emscripten_stack_restore = wasmExports2["_emscripten_stack_restore"];
    __emscripten_stack_alloc = wasmExports2["_emscripten_stack_alloc"];
    _emscripten_stack_get_current = wasmExports2["emscripten_stack_get_current"];
    ___wasm_apply_data_relocs = wasmExports2["__wasm_apply_data_relocs"];
  }
  __name(assignWasmExports, "assignWasmExports");
  var wasmImports = {
    /** @export */
    __heap_base: ___heap_base,
    /** @export */
    __indirect_function_table: wasmTable,
    /** @export */
    __memory_base: ___memory_base,
    /** @export */
    __stack_high: ___stack_high,
    /** @export */
    __stack_low: ___stack_low,
    /** @export */
    __stack_pointer: ___stack_pointer,
    /** @export */
    __table_base: ___table_base,
    /** @export */
    _abort_js: __abort_js,
    /** @export */
    emscripten_resize_heap: _emscripten_resize_heap,
    /** @export */
    fd_close: _fd_close,
    /** @export */
    fd_seek: _fd_seek,
    /** @export */
    fd_write: _fd_write,
    /** @export */
    memory: wasmMemory,
    /** @export */
    tree_sitter_log_callback: _tree_sitter_log_callback,
    /** @export */
    tree_sitter_parse_callback: _tree_sitter_parse_callback,
    /** @export */
    tree_sitter_progress_callback: _tree_sitter_progress_callback,
    /** @export */
    tree_sitter_query_progress_callback: _tree_sitter_query_progress_callback
  };
  function callMain(args2 = []) {
    var entryFunction = resolveGlobalSymbol("main").sym;
    if (!entryFunction) return;
    args2.unshift(thisProgram);
    var argc = args2.length;
    var argv = stackAlloc((argc + 1) * 4);
    var argv_ptr = argv;
    args2.forEach((arg) => {
      LE_HEAP_STORE_U32((argv_ptr >> 2) * 4, stringToUTF8OnStack(arg));
      argv_ptr += 4;
    });
    LE_HEAP_STORE_U32((argv_ptr >> 2) * 4, 0);
    try {
      var ret = entryFunction(argc, argv);
      exitJS(
        ret,
        /* implicit = */
        true
      );
      return ret;
    } catch (e) {
      return handleException(e);
    }
  }
  __name(callMain, "callMain");
  function run(args2 = arguments_) {
    if (runDependencies > 0) {
      dependenciesFulfilled = run;
      return;
    }
    preRun();
    if (runDependencies > 0) {
      dependenciesFulfilled = run;
      return;
    }
    function doRun() {
      Module["calledRun"] = true;
      if (ABORT) return;
      initRuntime();
      preMain();
      readyPromiseResolve?.(Module);
      Module["onRuntimeInitialized"]?.();
      var noInitialRun = Module["noInitialRun"] || false;
      if (!noInitialRun) callMain(args2);
      postRun();
    }
    __name(doRun, "doRun");
    if (Module["setStatus"]) {
      Module["setStatus"]("Running...");
      setTimeout(() => {
        setTimeout(() => Module["setStatus"](""), 1);
        doRun();
      }, 1);
    } else {
      doRun();
    }
  }
  __name(run, "run");
  var wasmExports;
  wasmExports = await createWasm();
  run();
  if (runtimeInitialized) {
    moduleRtn = Module;
  } else {
    moduleRtn = new Promise((resolve, reject) => {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });
  }
  return moduleRtn;
}
__name(Module2, "Module");
var web_tree_sitter_default = Module2;
var Module3 = null;
async function initializeBinding(moduleOptions) {
  return Module3 ??= await web_tree_sitter_default(moduleOptions);
}
__name(initializeBinding, "initializeBinding");
function checkModule() {
  return !!Module3;
}
__name(checkModule, "checkModule");
var TRANSFER_BUFFER;
var LANGUAGE_VERSION;
var MIN_COMPATIBLE_VERSION;
var Parser = class {
  static {
    __name(this, "Parser");
  }
  /** @internal */
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  [1] = 0;
  // Internal handle for Wasm
  /** @internal */
  logCallback = null;
  /** The parser's current language. */
  language = null;
  /**
   * This must always be called before creating a Parser.
   *
   * You can optionally pass in options to configure the Wasm module, the most common
   * one being `locateFile` to help the module find the `.wasm` file.
   */
  static async init(moduleOptions) {
    setModule(await initializeBinding(moduleOptions));
    TRANSFER_BUFFER = C._ts_init();
    LANGUAGE_VERSION = C.getValue(TRANSFER_BUFFER, "i32");
    MIN_COMPATIBLE_VERSION = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
  }
  /**
   * Create a new parser.
   */
  constructor() {
    this.initialize();
  }
  /** @internal */
  initialize() {
    if (!checkModule()) {
      throw new Error("cannot construct a Parser before calling `init()`");
    }
    C._ts_parser_new_wasm();
    this[0] = C.getValue(TRANSFER_BUFFER, "i32");
    this[1] = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
  }
  /** Delete the parser, freeing its resources. */
  delete() {
    C._ts_parser_delete(this[0]);
    C._free(this[1]);
    this[0] = 0;
    this[1] = 0;
  }
  /**
   * Set the language that the parser should use for parsing.
   *
   * If the language was not successfully assigned, an error will be thrown.
   * This happens if the language was generated with an incompatible
   * version of the Tree-sitter CLI. Check the language's version using
   * {@link Language#version} and compare it to this library's
   * {@link LANGUAGE_VERSION} and {@link MIN_COMPATIBLE_VERSION} constants.
   */
  setLanguage(language) {
    let address;
    if (!language) {
      address = 0;
      this.language = null;
    } else if (language.constructor === Language) {
      address = language[0];
      const version = C._ts_language_abi_version(address);
      if (version < MIN_COMPATIBLE_VERSION || LANGUAGE_VERSION < version) {
        throw new Error(
          `Incompatible language version ${version}. Compatibility range ${MIN_COMPATIBLE_VERSION} through ${LANGUAGE_VERSION}.`
        );
      }
      this.language = language;
    } else {
      throw new Error("Argument must be a Language");
    }
    C._ts_parser_set_language(this[0], address);
    return this;
  }
  /**
   * Parse a slice of UTF8 text.
   *
   * @param {string | ParseCallback} callback - The UTF8-encoded text to parse or a callback function.
   *
   * @param {Tree | null} [oldTree] - A previous syntax tree parsed from the same document. If the text of the
   *   document has changed since `oldTree` was created, then you must edit `oldTree` to match
   *   the new text using {@link Tree#edit}.
   *
   * @param {ParseOptions} [options] - Options for parsing the text.
   *  This can be used to set the included ranges, or a progress callback.
   *
   * @returns {Tree | null} A {@link Tree} if parsing succeeded, or `null` if:
   *  - The parser has not yet had a language assigned with {@link Parser#setLanguage}.
   *  - The progress callback returned true.
   */
  parse(callback, oldTree, options) {
    if (typeof callback === "string") {
      C.currentParseCallback = (index) => callback.slice(index);
    } else if (typeof callback === "function") {
      C.currentParseCallback = callback;
    } else {
      throw new Error("Argument must be a string or a function");
    }
    if (options?.progressCallback) {
      C.currentProgressCallback = options.progressCallback;
    } else {
      C.currentProgressCallback = null;
    }
    if (this.logCallback) {
      C.currentLogCallback = this.logCallback;
      C._ts_parser_enable_logger_wasm(this[0], 1);
    } else {
      C.currentLogCallback = null;
      C._ts_parser_enable_logger_wasm(this[0], 0);
    }
    let rangeCount = 0;
    let rangeAddress = 0;
    if (options?.includedRanges) {
      rangeCount = options.includedRanges.length;
      rangeAddress = C._calloc(rangeCount, SIZE_OF_RANGE);
      let address = rangeAddress;
      for (let i2 = 0; i2 < rangeCount; i2++) {
        marshalRange(address, options.includedRanges[i2]);
        address += SIZE_OF_RANGE;
      }
    }
    const treeAddress = C._ts_parser_parse_wasm(
      this[0],
      this[1],
      oldTree ? oldTree[0] : 0,
      rangeAddress,
      rangeCount
    );
    if (!treeAddress) {
      C.currentParseCallback = null;
      C.currentLogCallback = null;
      C.currentProgressCallback = null;
      return null;
    }
    if (!this.language) {
      throw new Error("Parser must have a language to parse");
    }
    const result = new Tree(INTERNAL, treeAddress, this.language, C.currentParseCallback);
    C.currentParseCallback = null;
    C.currentLogCallback = null;
    C.currentProgressCallback = null;
    return result;
  }
  /**
   * Instruct the parser to start the next parse from the beginning.
   *
   * If the parser previously failed because of a callback, 
   * then by default, it will resume where it left off on the
   * next call to {@link Parser#parse} or other parsing functions.
   * If you don't want to resume, and instead intend to use this parser to
   * parse some other document, you must call `reset` first.
   */
  reset() {
    C._ts_parser_reset(this[0]);
  }
  /** Get the ranges of text that the parser will include when parsing. */
  getIncludedRanges() {
    C._ts_parser_included_ranges_wasm(this[0]);
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const buffer = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const result = new Array(count);
    if (count > 0) {
      let address = buffer;
      for (let i2 = 0; i2 < count; i2++) {
        result[i2] = unmarshalRange(address);
        address += SIZE_OF_RANGE;
      }
      C._free(buffer);
    }
    return result;
  }
  /** Set the logging callback that a parser should use during parsing. */
  setLogger(callback) {
    if (!callback) {
      this.logCallback = null;
    } else if (typeof callback !== "function") {
      throw new Error("Logger callback must be a function");
    } else {
      this.logCallback = callback;
    }
    return this;
  }
  /** Get the parser's current logger. */
  getLogger() {
    return this.logCallback;
  }
};
var PREDICATE_STEP_TYPE_CAPTURE = 1;
var PREDICATE_STEP_TYPE_STRING = 2;
var QUERY_WORD_REGEX = /[\w-]+/g;
var CaptureQuantifier = {
  Zero: 0,
  ZeroOrOne: 1,
  ZeroOrMore: 2,
  One: 3,
  OneOrMore: 4
};
var isCaptureStep = /* @__PURE__ */ __name((step) => step.type === "capture", "isCaptureStep");
var isStringStep = /* @__PURE__ */ __name((step) => step.type === "string", "isStringStep");
var QueryErrorKind = {
  Syntax: 1,
  NodeName: 2,
  FieldName: 3,
  CaptureName: 4,
  PatternStructure: 5
};
var QueryError = class _QueryError extends Error {
  constructor(kind, info2, index, length) {
    super(_QueryError.formatMessage(kind, info2));
    this.kind = kind;
    this.info = info2;
    this.index = index;
    this.length = length;
    this.name = "QueryError";
  }
  static {
    __name(this, "QueryError");
  }
  /** Formats an error message based on the error kind and info */
  static formatMessage(kind, info2) {
    switch (kind) {
      case QueryErrorKind.NodeName:
        return `Bad node name '${info2.word}'`;
      case QueryErrorKind.FieldName:
        return `Bad field name '${info2.word}'`;
      case QueryErrorKind.CaptureName:
        return `Bad capture name @${info2.word}`;
      case QueryErrorKind.PatternStructure:
        return `Bad pattern structure at offset ${info2.suffix}`;
      case QueryErrorKind.Syntax:
        return `Bad syntax at offset ${info2.suffix}`;
    }
  }
};
function parseAnyPredicate(steps, index, operator, textPredicates) {
  if (steps.length !== 3) {
    throw new Error(
      `Wrong number of arguments to \`#${operator}\` predicate. Expected 2, got ${steps.length - 1}`
    );
  }
  if (!isCaptureStep(steps[1])) {
    throw new Error(
      `First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}"`
    );
  }
  const isPositive = operator === "eq?" || operator === "any-eq?";
  const matchAll = !operator.startsWith("any-");
  if (isCaptureStep(steps[2])) {
    const captureName1 = steps[1].name;
    const captureName2 = steps[2].name;
    textPredicates[index].push((captures) => {
      const nodes1 = [];
      const nodes2 = [];
      for (const c of captures) {
        if (c.name === captureName1) nodes1.push(c.node);
        if (c.name === captureName2) nodes2.push(c.node);
      }
      const compare = /* @__PURE__ */ __name((n1, n2, positive) => {
        return positive ? n1.text === n2.text : n1.text !== n2.text;
      }, "compare");
      return matchAll ? nodes1.every((n1) => nodes2.some((n2) => compare(n1, n2, isPositive))) : nodes1.some((n1) => nodes2.some((n2) => compare(n1, n2, isPositive)));
    });
  } else {
    const captureName = steps[1].name;
    const stringValue = steps[2].value;
    const matches = /* @__PURE__ */ __name((n) => n.text === stringValue, "matches");
    const doesNotMatch = /* @__PURE__ */ __name((n) => n.text !== stringValue, "doesNotMatch");
    textPredicates[index].push((captures) => {
      const nodes = [];
      for (const c of captures) {
        if (c.name === captureName) nodes.push(c.node);
      }
      const test2 = isPositive ? matches : doesNotMatch;
      return matchAll ? nodes.every(test2) : nodes.some(test2);
    });
  }
}
__name(parseAnyPredicate, "parseAnyPredicate");
function parseMatchPredicate(steps, index, operator, textPredicates) {
  if (steps.length !== 3) {
    throw new Error(
      `Wrong number of arguments to \`#${operator}\` predicate. Expected 2, got ${steps.length - 1}.`
    );
  }
  if (steps[1].type !== "capture") {
    throw new Error(
      `First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`
    );
  }
  if (steps[2].type !== "string") {
    throw new Error(
      `Second argument of \`#${operator}\` predicate must be a string. Got @${steps[2].name}.`
    );
  }
  const isPositive = operator === "match?" || operator === "any-match?";
  const matchAll = !operator.startsWith("any-");
  const captureName = steps[1].name;
  const regex = new RegExp(steps[2].value);
  textPredicates[index].push((captures) => {
    const nodes = [];
    for (const c of captures) {
      if (c.name === captureName) nodes.push(c.node.text);
    }
    const test2 = /* @__PURE__ */ __name((text, positive) => {
      return positive ? regex.test(text) : !regex.test(text);
    }, "test");
    if (nodes.length === 0) return !isPositive;
    return matchAll ? nodes.every((text) => test2(text, isPositive)) : nodes.some((text) => test2(text, isPositive));
  });
}
__name(parseMatchPredicate, "parseMatchPredicate");
function parseAnyOfPredicate(steps, index, operator, textPredicates) {
  if (steps.length < 2) {
    throw new Error(
      `Wrong number of arguments to \`#${operator}\` predicate. Expected at least 1. Got ${steps.length - 1}.`
    );
  }
  if (steps[1].type !== "capture") {
    throw new Error(
      `First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`
    );
  }
  const isPositive = operator === "any-of?";
  const captureName = steps[1].name;
  const stringSteps = steps.slice(2);
  if (!stringSteps.every(isStringStep)) {
    throw new Error(
      `Arguments to \`#${operator}\` predicate must be strings.".`
    );
  }
  const values = stringSteps.map((s) => s.value);
  textPredicates[index].push((captures) => {
    const nodes = [];
    for (const c of captures) {
      if (c.name === captureName) nodes.push(c.node.text);
    }
    if (nodes.length === 0) return !isPositive;
    return nodes.every((text) => values.includes(text)) === isPositive;
  });
}
__name(parseAnyOfPredicate, "parseAnyOfPredicate");
function parseIsPredicate(steps, index, operator, assertedProperties, refutedProperties) {
  if (steps.length < 2 || steps.length > 3) {
    throw new Error(
      `Wrong number of arguments to \`#${operator}\` predicate. Expected 1 or 2. Got ${steps.length - 1}.`
    );
  }
  if (!steps.every(isStringStep)) {
    throw new Error(
      `Arguments to \`#${operator}\` predicate must be strings.".`
    );
  }
  const properties = operator === "is?" ? assertedProperties : refutedProperties;
  if (!properties[index]) properties[index] = {};
  properties[index][steps[1].value] = steps[2]?.value ?? null;
}
__name(parseIsPredicate, "parseIsPredicate");
function parseSetDirective(steps, index, setProperties) {
  if (steps.length < 2 || steps.length > 3) {
    throw new Error(`Wrong number of arguments to \`#set!\` predicate. Expected 1 or 2. Got ${steps.length - 1}.`);
  }
  if (!steps.every(isStringStep)) {
    throw new Error(`Arguments to \`#set!\` predicate must be strings.".`);
  }
  if (!setProperties[index]) setProperties[index] = {};
  setProperties[index][steps[1].value] = steps[2]?.value ?? null;
}
__name(parseSetDirective, "parseSetDirective");
function parsePattern(index, stepType, stepValueId, captureNames, stringValues, steps, textPredicates, predicates, setProperties, assertedProperties, refutedProperties) {
  if (stepType === PREDICATE_STEP_TYPE_CAPTURE) {
    const name2 = captureNames[stepValueId];
    steps.push({ type: "capture", name: name2 });
  } else if (stepType === PREDICATE_STEP_TYPE_STRING) {
    steps.push({ type: "string", value: stringValues[stepValueId] });
  } else if (steps.length > 0) {
    if (steps[0].type !== "string") {
      throw new Error("Predicates must begin with a literal value");
    }
    const operator = steps[0].value;
    switch (operator) {
      case "any-not-eq?":
      case "not-eq?":
      case "any-eq?":
      case "eq?":
        parseAnyPredicate(steps, index, operator, textPredicates);
        break;
      case "any-not-match?":
      case "not-match?":
      case "any-match?":
      case "match?":
        parseMatchPredicate(steps, index, operator, textPredicates);
        break;
      case "not-any-of?":
      case "any-of?":
        parseAnyOfPredicate(steps, index, operator, textPredicates);
        break;
      case "is?":
      case "is-not?":
        parseIsPredicate(steps, index, operator, assertedProperties, refutedProperties);
        break;
      case "set!":
        parseSetDirective(steps, index, setProperties);
        break;
      default:
        predicates[index].push({ operator, operands: steps.slice(1) });
    }
    steps.length = 0;
  }
}
__name(parsePattern, "parsePattern");
var Query = class {
  static {
    __name(this, "Query");
  }
  /** @internal */
  [0] = 0;
  // Internal handle for Wasm
  /** @internal */
  exceededMatchLimit;
  /** @internal */
  textPredicates;
  /** The names of the captures used in the query. */
  captureNames;
  /** The quantifiers of the captures used in the query. */
  captureQuantifiers;
  /**
   * The other user-defined predicates associated with the given index.
   *
   * This includes predicates with operators other than:
   * - `match?`
   * - `eq?` and `not-eq?`
   * - `any-of?` and `not-any-of?`
   * - `is?` and `is-not?`
   * - `set!`
   */
  predicates;
  /** The properties for predicates with the operator `set!`. */
  setProperties;
  /** The properties for predicates with the operator `is?`. */
  assertedProperties;
  /** The properties for predicates with the operator `is-not?`. */
  refutedProperties;
  /** The maximum number of in-progress matches for this cursor. */
  matchLimit;
  /**
   * Create a new query from a string containing one or more S-expression
   * patterns.
   *
   * The query is associated with a particular language, and can only be run
   * on syntax nodes parsed with that language. References to Queries can be
   * shared between multiple threads.
   *
   * @link {@see https://tree-sitter.github.io/tree-sitter/using-parsers/queries}
   */
  constructor(language, source) {
    const sourceLength = C.lengthBytesUTF8(source);
    const sourceAddress = C._malloc(sourceLength + 1);
    C.stringToUTF8(source, sourceAddress, sourceLength + 1);
    const address = C._ts_query_new(
      language[0],
      sourceAddress,
      sourceLength,
      TRANSFER_BUFFER,
      TRANSFER_BUFFER + SIZE_OF_INT
    );
    if (!address) {
      const errorId = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
      const errorByte = C.getValue(TRANSFER_BUFFER, "i32");
      const errorIndex = C.UTF8ToString(sourceAddress, errorByte).length;
      const suffix = source.slice(errorIndex, errorIndex + 100).split("\n")[0];
      const word = suffix.match(QUERY_WORD_REGEX)?.[0] ?? "";
      C._free(sourceAddress);
      switch (errorId) {
        case QueryErrorKind.Syntax:
          throw new QueryError(QueryErrorKind.Syntax, { suffix: `${errorIndex}: '${suffix}'...` }, errorIndex, 0);
        case QueryErrorKind.NodeName:
          throw new QueryError(errorId, { word }, errorIndex, word.length);
        case QueryErrorKind.FieldName:
          throw new QueryError(errorId, { word }, errorIndex, word.length);
        case QueryErrorKind.CaptureName:
          throw new QueryError(errorId, { word }, errorIndex, word.length);
        case QueryErrorKind.PatternStructure:
          throw new QueryError(errorId, { suffix: `${errorIndex}: '${suffix}'...` }, errorIndex, 0);
      }
    }
    const stringCount = C._ts_query_string_count(address);
    const captureCount = C._ts_query_capture_count(address);
    const patternCount = C._ts_query_pattern_count(address);
    const captureNames = new Array(captureCount);
    const captureQuantifiers = new Array(patternCount);
    const stringValues = new Array(stringCount);
    for (let i2 = 0; i2 < captureCount; i2++) {
      const nameAddress = C._ts_query_capture_name_for_id(
        address,
        i2,
        TRANSFER_BUFFER
      );
      const nameLength = C.getValue(TRANSFER_BUFFER, "i32");
      captureNames[i2] = C.UTF8ToString(nameAddress, nameLength);
    }
    for (let i2 = 0; i2 < patternCount; i2++) {
      const captureQuantifiersArray = new Array(captureCount);
      for (let j = 0; j < captureCount; j++) {
        const quantifier = C._ts_query_capture_quantifier_for_id(address, i2, j);
        captureQuantifiersArray[j] = quantifier;
      }
      captureQuantifiers[i2] = captureQuantifiersArray;
    }
    for (let i2 = 0; i2 < stringCount; i2++) {
      const valueAddress = C._ts_query_string_value_for_id(
        address,
        i2,
        TRANSFER_BUFFER
      );
      const nameLength = C.getValue(TRANSFER_BUFFER, "i32");
      stringValues[i2] = C.UTF8ToString(valueAddress, nameLength);
    }
    const setProperties = new Array(patternCount);
    const assertedProperties = new Array(patternCount);
    const refutedProperties = new Array(patternCount);
    const predicates = new Array(patternCount);
    const textPredicates = new Array(patternCount);
    for (let i2 = 0; i2 < patternCount; i2++) {
      const predicatesAddress = C._ts_query_predicates_for_pattern(address, i2, TRANSFER_BUFFER);
      const stepCount = C.getValue(TRANSFER_BUFFER, "i32");
      predicates[i2] = [];
      textPredicates[i2] = [];
      const steps = new Array();
      let stepAddress = predicatesAddress;
      for (let j = 0; j < stepCount; j++) {
        const stepType = C.getValue(stepAddress, "i32");
        stepAddress += SIZE_OF_INT;
        const stepValueId = C.getValue(stepAddress, "i32");
        stepAddress += SIZE_OF_INT;
        parsePattern(
          i2,
          stepType,
          stepValueId,
          captureNames,
          stringValues,
          steps,
          textPredicates,
          predicates,
          setProperties,
          assertedProperties,
          refutedProperties
        );
      }
      Object.freeze(textPredicates[i2]);
      Object.freeze(predicates[i2]);
      Object.freeze(setProperties[i2]);
      Object.freeze(assertedProperties[i2]);
      Object.freeze(refutedProperties[i2]);
    }
    C._free(sourceAddress);
    this[0] = address;
    this.captureNames = captureNames;
    this.captureQuantifiers = captureQuantifiers;
    this.textPredicates = textPredicates;
    this.predicates = predicates;
    this.setProperties = setProperties;
    this.assertedProperties = assertedProperties;
    this.refutedProperties = refutedProperties;
    this.exceededMatchLimit = false;
  }
  /** Delete the query, freeing its resources. */
  delete() {
    C._ts_query_delete(this[0]);
    this[0] = 0;
  }
  /**
   * Iterate over all of the matches in the order that they were found.
   *
   * Each match contains the index of the pattern that matched, and a list of
   * captures. Because multiple patterns can match the same set of nodes,
   * one match may contain captures that appear *before* some of the
   * captures from a previous match.
   *
   * @param {Node} node - The node to execute the query on.
   *
   * @param {QueryOptions} options - Options for query execution.
   */
  matches(node, options = {}) {
    const startPosition = options.startPosition ?? ZERO_POINT;
    const endPosition = options.endPosition ?? ZERO_POINT;
    const startIndex = options.startIndex ?? 0;
    const endIndex = options.endIndex ?? 0;
    const startContainingPosition = options.startContainingPosition ?? ZERO_POINT;
    const endContainingPosition = options.endContainingPosition ?? ZERO_POINT;
    const startContainingIndex = options.startContainingIndex ?? 0;
    const endContainingIndex = options.endContainingIndex ?? 0;
    const matchLimit = options.matchLimit ?? 4294967295;
    const maxStartDepth = options.maxStartDepth ?? 4294967295;
    const progressCallback = options.progressCallback;
    if (typeof matchLimit !== "number") {
      throw new Error("Arguments must be numbers");
    }
    this.matchLimit = matchLimit;
    if (endIndex !== 0 && startIndex > endIndex) {
      throw new Error("`startIndex` cannot be greater than `endIndex`");
    }
    if (endPosition !== ZERO_POINT && (startPosition.row > endPosition.row || startPosition.row === endPosition.row && startPosition.column > endPosition.column)) {
      throw new Error("`startPosition` cannot be greater than `endPosition`");
    }
    if (endContainingIndex !== 0 && startContainingIndex > endContainingIndex) {
      throw new Error("`startContainingIndex` cannot be greater than `endContainingIndex`");
    }
    if (endContainingPosition !== ZERO_POINT && (startContainingPosition.row > endContainingPosition.row || startContainingPosition.row === endContainingPosition.row && startContainingPosition.column > endContainingPosition.column)) {
      throw new Error("`startContainingPosition` cannot be greater than `endContainingPosition`");
    }
    if (progressCallback) {
      C.currentQueryProgressCallback = progressCallback;
    }
    marshalNode(node);
    C._ts_query_matches_wasm(
      this[0],
      node.tree[0],
      startPosition.row,
      startPosition.column,
      endPosition.row,
      endPosition.column,
      startIndex,
      endIndex,
      startContainingPosition.row,
      startContainingPosition.column,
      endContainingPosition.row,
      endContainingPosition.column,
      startContainingIndex,
      endContainingIndex,
      matchLimit,
      maxStartDepth
    );
    const rawCount = C.getValue(TRANSFER_BUFFER, "i32");
    const startAddress = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const didExceedMatchLimit = C.getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
    const result = new Array(rawCount);
    this.exceededMatchLimit = Boolean(didExceedMatchLimit);
    let filteredCount = 0;
    let address = startAddress;
    for (let i2 = 0; i2 < rawCount; i2++) {
      const patternIndex = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      const captureCount = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      const captures = new Array(captureCount);
      address = unmarshalCaptures(this, node.tree, address, patternIndex, captures);
      if (this.textPredicates[patternIndex].every((p) => p(captures))) {
        result[filteredCount] = { patternIndex, captures };
        const setProperties = this.setProperties[patternIndex];
        result[filteredCount].setProperties = setProperties;
        const assertedProperties = this.assertedProperties[patternIndex];
        result[filteredCount].assertedProperties = assertedProperties;
        const refutedProperties = this.refutedProperties[patternIndex];
        result[filteredCount].refutedProperties = refutedProperties;
        filteredCount++;
      }
    }
    result.length = filteredCount;
    C._free(startAddress);
    C.currentQueryProgressCallback = null;
    return result;
  }
  /**
   * Iterate over all of the individual captures in the order that they
   * appear.
   *
   * This is useful if you don't care about which pattern matched, and just
   * want a single, ordered sequence of captures.
   *
   * @param {Node} node - The node to execute the query on.
   *
   * @param {QueryOptions} options - Options for query execution.
   */
  captures(node, options = {}) {
    const startPosition = options.startPosition ?? ZERO_POINT;
    const endPosition = options.endPosition ?? ZERO_POINT;
    const startIndex = options.startIndex ?? 0;
    const endIndex = options.endIndex ?? 0;
    const startContainingPosition = options.startContainingPosition ?? ZERO_POINT;
    const endContainingPosition = options.endContainingPosition ?? ZERO_POINT;
    const startContainingIndex = options.startContainingIndex ?? 0;
    const endContainingIndex = options.endContainingIndex ?? 0;
    const matchLimit = options.matchLimit ?? 4294967295;
    const maxStartDepth = options.maxStartDepth ?? 4294967295;
    const progressCallback = options.progressCallback;
    if (typeof matchLimit !== "number") {
      throw new Error("Arguments must be numbers");
    }
    this.matchLimit = matchLimit;
    if (endIndex !== 0 && startIndex > endIndex) {
      throw new Error("`startIndex` cannot be greater than `endIndex`");
    }
    if (endPosition !== ZERO_POINT && (startPosition.row > endPosition.row || startPosition.row === endPosition.row && startPosition.column > endPosition.column)) {
      throw new Error("`startPosition` cannot be greater than `endPosition`");
    }
    if (endContainingIndex !== 0 && startContainingIndex > endContainingIndex) {
      throw new Error("`startContainingIndex` cannot be greater than `endContainingIndex`");
    }
    if (endContainingPosition !== ZERO_POINT && (startContainingPosition.row > endContainingPosition.row || startContainingPosition.row === endContainingPosition.row && startContainingPosition.column > endContainingPosition.column)) {
      throw new Error("`startContainingPosition` cannot be greater than `endContainingPosition`");
    }
    if (progressCallback) {
      C.currentQueryProgressCallback = progressCallback;
    }
    marshalNode(node);
    C._ts_query_captures_wasm(
      this[0],
      node.tree[0],
      startPosition.row,
      startPosition.column,
      endPosition.row,
      endPosition.column,
      startIndex,
      endIndex,
      startContainingPosition.row,
      startContainingPosition.column,
      endContainingPosition.row,
      endContainingPosition.column,
      startContainingIndex,
      endContainingIndex,
      matchLimit,
      maxStartDepth
    );
    const count = C.getValue(TRANSFER_BUFFER, "i32");
    const startAddress = C.getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
    const didExceedMatchLimit = C.getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
    const result = new Array();
    this.exceededMatchLimit = Boolean(didExceedMatchLimit);
    const captures = new Array();
    let address = startAddress;
    for (let i2 = 0; i2 < count; i2++) {
      const patternIndex = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      const captureCount = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      const captureIndex = C.getValue(address, "i32");
      address += SIZE_OF_INT;
      captures.length = captureCount;
      address = unmarshalCaptures(this, node.tree, address, patternIndex, captures);
      if (this.textPredicates[patternIndex].every((p) => p(captures))) {
        const capture = captures[captureIndex];
        const setProperties = this.setProperties[patternIndex];
        capture.setProperties = setProperties;
        const assertedProperties = this.assertedProperties[patternIndex];
        capture.assertedProperties = assertedProperties;
        const refutedProperties = this.refutedProperties[patternIndex];
        capture.refutedProperties = refutedProperties;
        result.push(capture);
      }
    }
    C._free(startAddress);
    C.currentQueryProgressCallback = null;
    return result;
  }
  /** Get the predicates for a given pattern. */
  predicatesForPattern(patternIndex) {
    return this.predicates[patternIndex];
  }
  /**
   * Disable a certain capture within a query.
   *
   * This prevents the capture from being returned in matches, and also
   * avoids any resource usage associated with recording the capture.
   */
  disableCapture(captureName) {
    const captureNameLength = C.lengthBytesUTF8(captureName);
    const captureNameAddress = C._malloc(captureNameLength + 1);
    C.stringToUTF8(captureName, captureNameAddress, captureNameLength + 1);
    C._ts_query_disable_capture(this[0], captureNameAddress, captureNameLength);
    C._free(captureNameAddress);
  }
  /**
   * Disable a certain pattern within a query.
   *
   * This prevents the pattern from matching, and also avoids any resource
   * usage associated with the pattern. This throws an error if the pattern
   * index is out of bounds.
   */
  disablePattern(patternIndex) {
    if (patternIndex >= this.predicates.length) {
      throw new Error(
        `Pattern index is ${patternIndex} but the pattern count is ${this.predicates.length}`
      );
    }
    C._ts_query_disable_pattern(this[0], patternIndex);
  }
  /**
   * Check if, on its last execution, this cursor exceeded its maximum number
   * of in-progress matches.
   */
  didExceedMatchLimit() {
    return this.exceededMatchLimit;
  }
  /** Get the byte offset where the given pattern starts in the query's source. */
  startIndexForPattern(patternIndex) {
    if (patternIndex >= this.predicates.length) {
      throw new Error(
        `Pattern index is ${patternIndex} but the pattern count is ${this.predicates.length}`
      );
    }
    return C._ts_query_start_byte_for_pattern(this[0], patternIndex);
  }
  /** Get the byte offset where the given pattern ends in the query's source. */
  endIndexForPattern(patternIndex) {
    if (patternIndex >= this.predicates.length) {
      throw new Error(
        `Pattern index is ${patternIndex} but the pattern count is ${this.predicates.length}`
      );
    }
    return C._ts_query_end_byte_for_pattern(this[0], patternIndex);
  }
  /** Get the number of patterns in the query. */
  patternCount() {
    return C._ts_query_pattern_count(this[0]);
  }
  /** Get the index for a given capture name. */
  captureIndexForName(captureName) {
    return this.captureNames.indexOf(captureName);
  }
  /** Check if a given pattern within a query has a single root node. */
  isPatternRooted(patternIndex) {
    return C._ts_query_is_pattern_rooted(this[0], patternIndex) === 1;
  }
  /** Check if a given pattern within a query has a single root node. */
  isPatternNonLocal(patternIndex) {
    return C._ts_query_is_pattern_non_local(this[0], patternIndex) === 1;
  }
  /**
   * Check if a given step in a query is 'definite'.
   *
   * A query step is 'definite' if its parent pattern will be guaranteed to
   * match successfully once it reaches the step.
   */
  isPatternGuaranteedAtStep(byteIndex) {
    return C._ts_query_is_pattern_guaranteed_at_step(this[0], byteIndex) === 1;
  }
};

// backend/sandbox/transpiler/parser.ts
var parserInstance = null;
var cppLanguage = null;
var initPromise = null;
async function initParser() {
  if (parserInstance && cppLanguage) return;
  if (initPromise) return initPromise;
  initPromise = doInit();
  return initPromise;
}
function isParserReady() {
  return parserInstance !== null && cppLanguage !== null;
}
function parseCpp(code) {
  if (!parserInstance || !cppLanguage) {
    throw new Error(
      "Tree-sitter parser not initialized. Call and await initParser() first."
    );
  }
  const tree = parserInstance.parse(code);
  if (!tree) {
    throw new Error("Tree-sitter parse returned null \u2014 unexpected failure.");
  }
  return tree;
}
async function doInit() {
  try {
    const isNode = typeof process !== "undefined" && process.versions?.node;
    const resolveWasmPath = (filename) => {
      if (isNode) {
        return `${process.cwd()}/public/${filename}`;
      }
      return `/${filename}`;
    };
    await Parser.init({
      locateFile(scriptName) {
        return resolveWasmPath(scriptName);
      }
    });
    parserInstance = new Parser();
    cppLanguage = await Language.load(resolveWasmPath("tree-sitter-cpp.wasm"));
    parserInstance.setLanguage(cppLanguage);
  } catch (error) {
    parserInstance = null;
    cppLanguage = null;
    initPromise = null;
    throw new Error(
      `Failed to initialize Tree-sitter C++ parser: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// backend/sandbox/transpiler/types.ts
var CPP_INTEGER_TYPES = /* @__PURE__ */ new Set([
  "int",
  "long",
  "short",
  "long long",
  "unsigned int",
  "long int",
  "short int",
  "unsigned long",
  "unsigned long long",
  "signed int",
  "char"
]);
var STL_METHOD_MAP = {
  "push_back": "push",
  "emplace_back": "push",
  "pop_back": "pop"
};
var STL_MATH_FUNCTIONS = {
  "abs": "Math.abs",
  "pow": "Math.pow",
  "sqrt": "Math.sqrt",
  "ceil": "Math.ceil",
  "floor": "Math.floor",
  "log": "Math.log",
  "log2": "Math.log2",
  "log10": "Math.log10",
  "round": "Math.round"
};
var CPP_CONSTANTS = {
  "INT_MAX": "Number.MAX_SAFE_INTEGER",
  "INT_MIN": "Number.MIN_SAFE_INTEGER",
  "LLONG_MAX": "Number.MAX_SAFE_INTEGER",
  "LLONG_MIN": "Number.MIN_SAFE_INTEGER",
  "nullptr": "null",
  "NULL": "null",
  "true": "true",
  "false": "false"
};

// backend/sandbox/transpiler/symbolTable.ts
var SymbolTable = class {
  constructor() {
    this.scopes = [/* @__PURE__ */ new Map()];
    this.currentDepth = 0;
  }
  /** Enter a new scope (e.g., function body, block) */
  enterScope() {
    this.currentDepth++;
    this.scopes.push(/* @__PURE__ */ new Map());
  }
  /** Exit the current scope, discarding its symbols */
  exitScope() {
    if (this.scopes.length > 1) {
      this.scopes.pop();
      this.currentDepth--;
    }
  }
  /** Declare a new symbol in the current scope */
  declare(name2, cppType, isConst = false) {
    const normalizedType = cppType.replace(/\s+/g, " ").trim();
    const containerKind = this.inferContainerKind(normalizedType);
    const isInteger = this.inferIsInteger(normalizedType);
    const info2 = {
      name: name2,
      cppType: normalizedType,
      isConst,
      isInteger,
      containerKind,
      scopeDepth: this.currentDepth
    };
    this.scopes[this.scopes.length - 1].set(name2, info2);
    return info2;
  }
  /** Look up a symbol by name, searching from innermost to outermost scope */
  lookup(name2) {
    for (let i2 = this.scopes.length - 1; i2 >= 0; i2--) {
      const info2 = this.scopes[i2].get(name2);
      if (info2) return info2;
    }
    return void 0;
  }
  /** Check if a variable has integer type (for Math.trunc wrapping) */
  isIntegerVariable(name2) {
    const info2 = this.lookup(name2);
    return info2?.isInteger ?? false;
  }
  /** Infer the container kind from a C++ type string */
  inferContainerKind(type) {
    const stripped = type.replace(/std::/g, "").trim();
    if (stripped.startsWith("vector")) return "vector";
    if (stripped.startsWith("map") || stripped.startsWith("unordered_map")) return "map";
    if (stripped.startsWith("set") || stripped.startsWith("unordered_set")) return "set";
    if (stripped.startsWith("pair")) return "pair";
    if (stripped.startsWith("stack")) return "stack";
    if (stripped.startsWith("queue")) return "queue";
    if (stripped.startsWith("priority_queue")) return "priority_queue";
    return null;
  }
  /** Check if a type is an integer type */
  inferIsInteger(type) {
    const stripped = type.replace(/std::/g, "").replace(/const\s+/g, "").trim();
    return CPP_INTEGER_TYPES.has(stripped);
  }
};

// backend/sandbox/transpiler/errors.ts
var WarningCollector = class {
  constructor() {
    this.warnings = [];
  }
  /** Record a warning about an unsupported or partially-supported construct */
  warn(line, column, nodeType, message) {
    this.warnings.push({ line, column, nodeType, message });
  }
  /** Get all collected warnings */
  getWarnings() {
    return [...this.warnings];
  }
  /** Get warnings as human-readable strings */
  getWarningStrings() {
    return this.warnings.map(
      (w) => `Line ${w.line}: [${w.nodeType}] ${w.message}`
    );
  }
  /** Emit all warnings as JS comments, suitable for prepending to output */
  toJsComments() {
    if (this.warnings.length === 0) return "";
    const lines = this.warnings.map(
      (w) => `// \u26A0\uFE0F Line ${w.line}: ${w.message}`
    );
    return lines.join("\n") + "\n";
  }
  /** Reset all warnings */
  clear() {
    this.warnings = [];
  }
};

// backend/sandbox/transpiler/transformer.ts
var SUPPORTED_NODE_TYPES = /* @__PURE__ */ new Set([
  "translation_unit",
  "function_definition",
  "declaration",
  "expression_statement",
  "return_statement",
  "break_statement",
  "continue_statement",
  "compound_statement",
  "if_statement",
  "else_clause",
  "for_statement",
  "for_range_loop",
  "while_statement",
  "do_statement",
  "switch_statement",
  "case_statement",
  "binary_expression",
  "unary_expression",
  "update_expression",
  "assignment_expression",
  "call_expression",
  "field_expression",
  "subscript_expression",
  "parenthesized_expression",
  "conditional_expression",
  "comma_expression",
  "number_literal",
  "string_literal",
  "char_literal",
  "concatenated_string",
  "true",
  "false",
  "null",
  "identifier",
  "comment",
  "template_type",
  "primitive_type",
  "sized_type_specifier",
  "placeholder_type_specifier",
  "type_qualifier",
  "storage_class_specifier",
  "preproc_include",
  "preproc_def",
  "preproc_call",
  "using_declaration",
  "type_definition",
  "alias_declaration",
  "struct_specifier",
  "class_specifier",
  "access_specifier",
  "sizeof_expression",
  "field_declaration_list",
  "field_declaration",
  "field_initializer_list",
  "field_initializer",
  "parameter_list",
  "parameter_declaration",
  "argument_list",
  "init_declarator",
  "initializer_list",
  "array_declarator",
  "pointer_declarator",
  "reference_declarator",
  "function_declarator",
  "parenthesized_declarator",
  "qualified_identifier",
  "template_function",
  "field_identifier",
  "type_identifier",
  "namespace_identifier",
  "condition_clause",
  "labeled_statement"
]);
var CppToJsTransformer = class {
  constructor() {
    this.helperFunctions = [];
    this.injectedHelpers = /* @__PURE__ */ new Set();
    this.queueVariables = /* @__PURE__ */ new Set();
    this.priorityQueueModes = /* @__PURE__ */ new Map();
    this.structDefinitions = /* @__PURE__ */ new Map();
    this.mainBody = "";
    this.insideMain = false;
    this.symbols = new SymbolTable();
    this.warnings = new WarningCollector();
  }
  /**
   * Transform a parsed C++ tree into JavaScript code.
   * Returns { code, warnings }.
   */
  transform(tree) {
    this.helperFunctions = [];
    this.injectedHelpers.clear();
    this.queueVariables.clear();
    this.priorityQueueModes.clear();
    this.structDefinitions.clear();
    this.mainBody = "";
    this.insideMain = false;
    this.visitTranslationUnit(tree.rootNode);
    const parts2 = [];
    const warningComments = this.warnings.toJsComments();
    if (warningComments) parts2.push(warningComments);
    for (const fn of this.helperFunctions) {
      parts2.push(fn);
    }
    if (this.mainBody) {
      parts2.push(this.mainBody);
    }
    const code = this.postProcessContainerSemantics(
      parts2.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()
    );
    return { code, warnings: this.warnings.getWarningStrings() };
  }
  ensureHelper(name2, code) {
    if (this.injectedHelpers.has(name2)) return;
    this.injectedHelpers.add(name2);
    this.helperFunctions.push(code);
  }
  ensurePriorityQueueHelpers() {
    this.ensureHelper(
      "__cppComparePriorityQueueValues",
      `function __cppComparePriorityQueueValues(left, right) {
  if (Array.isArray(left) && Array.isArray(right)) {
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index++) {
      const leftValue = left[index];
      const rightValue = right[index];
      if (leftValue === rightValue) continue;
      if (leftValue === undefined) return -1;
      if (rightValue === undefined) return 1;
      return leftValue < rightValue ? -1 : 1;
    }
    return 0;
  }

  if (left === right) return 0;
  return left < right ? -1 : 1;
}`
    );
    this.ensureHelper(
      "__cppPriorityQueuePush",
      `function __cppPriorityQueuePush(queue, value, isMinQueue) {
  queue.push(value);
  queue.sort((left, right) => {
    const comparison = __cppComparePriorityQueueValues(left, right);
    return isMinQueue ? comparison : -comparison;
  });
  return queue.length;
}`
    );
    this.ensureHelper(
      "__cppPriorityQueueTop",
      `function __cppPriorityQueueTop(queue, isMinQueue) {
  if (queue.length === 0) return undefined;
  return isMinQueue ? queue[0] : queue[queue.length - 1];
}`
    );
    this.ensureHelper(
      "__cppPriorityQueuePop",
      `function __cppPriorityQueuePop(queue, isMinQueue) {
  if (queue.length === 0) return undefined;
  return isMinQueue ? queue.shift() : queue.pop();
}`
    );
  }
  ensureMergeHelper() {
    this.ensureHelper(
      "__cppMergeSortedArrays",
      `function __cppMergeSortedArrays(left, right, comparator) {
  const merged = [];
  let leftIndex = 0;
  let rightIndex = 0;
  const compare = comparator || ((a, b) => a <= b);

  while (leftIndex < left.length && rightIndex < right.length) {
    if (compare(left[leftIndex], right[rightIndex])) {
      merged.push(left[leftIndex++]);
    } else {
      merged.push(right[rightIndex++]);
    }
  }

  while (leftIndex < left.length) merged.push(left[leftIndex++]);
  while (rightIndex < right.length) merged.push(right[rightIndex++]);

  return merged;
}`
    );
  }
  trackContainerVariable(varName, cppType, containerInfo) {
    if (!containerInfo) return;
    if (containerInfo.kind === "queue") {
      this.queueVariables.add(varName);
    }
    if (containerInfo.kind === "priority_queue") {
      const normalizedType = cppType.replace(/std::/g, "");
      const isMinQueue = /(?:^|[<,\s])greater(?:\s*<|$)/.test(normalizedType);
      this.priorityQueueModes.set(varName, isMinQueue);
      this.ensurePriorityQueueHelpers();
    }
  }
  postProcessContainerSemantics(code) {
    let result = code;
    this.queueVariables.forEach((name2) => {
      const escaped = name2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(
        new RegExp(`\\b${escaped}\\.pop\\s*\\(\\s*\\)`, "g"),
        `${name2}.shift()`
      );
    });
    this.priorityQueueModes.forEach((isMinQueue, name2) => {
      const escaped = name2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(
        new RegExp(`\\b${escaped}\\.top\\s*\\(\\s*\\)`, "g"),
        `__cppPriorityQueueTop(${name2}, ${isMinQueue})`
      );
      result = result.replace(
        new RegExp(`\\b${escaped}\\.pop\\s*\\(\\s*\\)`, "g"),
        `__cppPriorityQueuePop(${name2}, ${isMinQueue})`
      );
    });
    return result;
  }
  isStructType(typeName) {
    return this.structDefinitions.has(typeName.replace(/std::/g, "").trim());
  }
  handleStructSpecifier(node) {
    const nameNode = node.namedChild(0);
    const bodyNode = node.namedChild(1);
    const structName = nameNode?.text?.trim();
    if (!structName || !bodyNode || bodyNode.type !== "field_declaration_list") {
      this.warnUnsupported(node);
      return;
    }
    const fields = this.extractStructFields(structName, bodyNode);
    const constructors = this.extractStructConstructors(structName, bodyNode, fields);
    this.structDefinitions.set(structName, { name: structName, fields, constructors });
    this.ensureHelper(`struct:${structName}`, this.buildStructFactory(structName, fields, constructors));
  }
  extractStructFields(structName, bodyNode) {
    const fields = [];
    for (let i2 = 0; i2 < bodyNode.namedChildCount; i2++) {
      const child = bodyNode.namedChild(i2);
      if (child.type !== "field_declaration") continue;
      const typeNode = child.childForFieldName("type") ?? child.namedChild(0);
      const rawType = typeNode?.text?.replace(/std::/g, "").trim() ?? "auto";
      for (let childIndex = 1; childIndex < child.namedChildCount; childIndex++) {
        const declarator = child.namedChild(childIndex);
        const name2 = this.extractDeclaratorName(declarator);
        if (!name2 || name2 === "_unnamed") continue;
        fields.push({
          name: name2,
          cppType: rawType,
          isPointer: declarator.type === "pointer_declarator" || declarator.type === "reference_declarator",
          defaultValue: this.getStructFieldDefaultValue(structName, rawType, declarator)
        });
      }
    }
    return fields;
  }
  getStructFieldDefaultValue(structName, cppType, declarator) {
    if (declarator.type === "pointer_declarator" || declarator.type === "reference_declarator") {
      return "null";
    }
    const normalizedType = cppType.replace(/std::/g, "").trim();
    if (normalizedType === structName) {
      return "null";
    }
    if (this.isStructType(normalizedType)) {
      return `${normalizedType}()`;
    }
    return this.getDefaultValue(normalizedType, null);
  }
  extractStructConstructors(structName, bodyNode, fields) {
    const constructors = [];
    const fieldNames = new Set(fields.map((field) => field.name));
    for (let i2 = 0; i2 < bodyNode.namedChildCount; i2++) {
      const child = bodyNode.namedChild(i2);
      if (child.type !== "function_definition") continue;
      const declarator = child.childForFieldName("declarator");
      if (this.extractFunctionName(declarator) !== structName) continue;
      const params = this.extractFunctionParams(declarator);
      const assignments = [];
      const initializerList = child.namedChildCount > 1 && child.namedChild(1)?.type === "field_initializer_list" ? child.namedChild(1) : child.childForFieldName("declarator")?.nextNamedSibling?.type === "field_initializer_list" ? child.childForFieldName("declarator")?.nextNamedSibling : null;
      const body2 = child.childForFieldName("body");
      if (initializerList) {
        assignments.push(...this.extractStructInitializerAssignments(initializerList, fieldNames));
      }
      if (body2) {
        assignments.push(...this.extractStructBodyAssignments(body2, fieldNames));
      }
      constructors.push({ params, assignments });
    }
    return constructors;
  }
  extractStructInitializerAssignments(initializerList, fieldNames) {
    const assignments = [];
    for (let i2 = 0; i2 < initializerList.namedChildCount; i2++) {
      const initializer = initializerList.namedChild(i2);
      if (initializer.type !== "field_initializer") continue;
      const fieldNode = initializer.namedChild(0);
      const argListNode = initializer.namedChild(1);
      const fieldName = fieldNode?.text?.trim();
      if (!fieldName || !fieldNames.has(fieldName) || !argListNode) continue;
      const args2 = this.visitArgumentList(argListNode);
      const expr = args2[0] ?? "undefined";
      assignments.push(`instance.${fieldName} = ${expr};`);
    }
    return assignments;
  }
  extractStructBodyAssignments(body2, fieldNames) {
    const assignments = [];
    for (let i2 = 0; i2 < body2.namedChildCount; i2++) {
      const child = body2.namedChild(i2);
      if (child.type !== "expression_statement") continue;
      const expr = child.namedChild(0);
      if (!expr || expr.type !== "assignment_expression") continue;
      const left = expr.childForFieldName("left");
      const right = expr.childForFieldName("right");
      if (!left || !right) continue;
      const fieldName = this.extractStructFieldTarget(left, fieldNames);
      if (!fieldName) continue;
      assignments.push(`instance.${fieldName} = ${this.visitExpression(right)};`);
    }
    return assignments;
  }
  extractStructFieldTarget(node, fieldNames) {
    if (node.type === "identifier" && fieldNames.has(node.text)) {
      return node.text;
    }
    if (node.type === "field_expression") {
      const field = node.childForFieldName("field");
      if (field?.text && fieldNames.has(field.text)) {
        return field.text;
      }
    }
    return null;
  }
  buildStructFactory(structName, fields, constructors) {
    const defaultAssignments = fields.map((field) => `  instance.${field.name} = ${field.defaultValue};`).join("\n");
    const constructorCases = constructors.map((ctor) => {
      const lines = [`    case ${ctor.params.length}: {`];
      ctor.params.forEach((param, index) => {
        lines.push(`      const ${param.name} = args[${index}];`);
      });
      if (ctor.assignments.length > 0) {
        ctor.assignments.forEach((assignment) => lines.push(`      ${assignment}`));
      } else {
        fields.forEach((field, index) => {
          if (index < ctor.params.length) {
            lines.push(`      instance.${field.name} = args[${index}];`);
          }
        });
      }
      lines.push("      return instance;");
      lines.push("    }");
      return lines.join("\n");
    });
    const positionalFallback = fields.map((field, index) => `  if (args.length > ${index}) instance.${field.name} = args[${index}];`).join("\n");
    const overloadBlock = constructorCases.length > 0 ? `  switch (args.length) {
${constructorCases.join("\n")}
  }
` : "";
    const fallbackBlock = positionalFallback ? `
${positionalFallback}
` : "\n";
    return `function ${structName}(...args) {
  const instance = {};
${defaultAssignments}
${overloadBlock}${fallbackBlock}  return instance;
}`;
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // TOP LEVEL
  // ═══════════════════════════════════════════════════════════════════════════
  visitTranslationUnit(node) {
    for (let i2 = 0; i2 < node.namedChildCount; i2++) {
      const child = node.namedChild(i2);
      switch (child.type) {
        case "preproc_include":
          break;
        case "preproc_def":
          this.handlePreprocDef(child);
          break;
        case "using_declaration":
          break;
        case "struct_specifier":
        case "class_specifier":
          this.handleStructSpecifier(child);
          break;
        case "function_definition":
          this.handleFunctionDefinition(child);
          break;
        case "declaration":
          this.mainBody += this.visitDeclaration(child) + "\n";
          break;
        case "type_definition":
        case "alias_declaration":
          break;
        case "comment":
          this.mainBody += child.text + "\n";
          break;
        case "expression_statement":
          this.mainBody += this.visitExpressionStatement(child) + "\n";
          break;
        default:
          if (child.type === "preproc_call") break;
          this.warnUnsupported(child);
          break;
      }
    }
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // PREPROCESSOR
  // ═══════════════════════════════════════════════════════════════════════════
  handlePreprocDef(node) {
    const name2 = node.childForFieldName("name")?.text ?? "";
    const value = node.childForFieldName("value")?.text?.trim() ?? "";
    if (name2 && value) {
      const line = `const ${name2} = ${value};`;
      this.mainBody += line + "\n";
    }
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  handleFunctionDefinition(node) {
    const declarator = node.childForFieldName("declarator");
    const funcName = this.extractFunctionName(declarator);
    const body2 = node.childForFieldName("body");
    const type = node.childForFieldName("type");
    if (funcName === "main") {
      this.insideMain = true;
      if (body2) {
        this.symbols.enterScope();
        this.mainBody += this.visitCompoundStatementBody(body2, true);
        this.symbols.exitScope();
      }
      this.insideMain = false;
    } else {
      const params = this.extractFunctionParams(declarator);
      const returnType = type?.text ?? "void";
      this.symbols.declare(funcName, returnType, false);
      this.symbols.enterScope();
      for (const p of params) {
        if (p.name) this.symbols.declare(p.name, p.type, false);
      }
      const paramStr = params.map((p) => p.name).join(", ");
      let bodyStr = "";
      if (body2) {
        bodyStr = this.visitCompoundStatementBody(body2, false);
      }
      this.helperFunctions.push(`function ${funcName}(${paramStr}) {
${bodyStr}
}`);
      this.symbols.exitScope();
    }
  }
  extractFunctionName(declarator) {
    if (!declarator) return "unknown";
    if (declarator.type === "function_declarator") {
      const nameNode = declarator.childForFieldName("declarator");
      return nameNode?.text ?? "unknown";
    }
    if (declarator.type === "pointer_declarator" || declarator.type === "reference_declarator") {
      for (let i2 = 0; i2 < declarator.namedChildCount; i2++) {
        const child = declarator.namedChild(i2);
        if (child.type === "function_declarator") {
          return this.extractFunctionName(child);
        }
      }
    }
    return declarator.text ?? "unknown";
  }
  extractFunctionParams(declarator) {
    if (!declarator) return [];
    let funcDecl = declarator;
    if (declarator.type !== "function_declarator") {
      for (let i2 = 0; i2 < declarator.namedChildCount; i2++) {
        const child = declarator.namedChild(i2);
        if (child.type === "function_declarator") {
          funcDecl = child;
          break;
        }
      }
    }
    const paramList = funcDecl.childForFieldName("parameters");
    if (!paramList) return [];
    const params = [];
    for (let i2 = 0; i2 < paramList.namedChildCount; i2++) {
      const param = paramList.namedChild(i2);
      if (param.type === "parameter_declaration") {
        const paramType = param.childForFieldName("type")?.text ?? "auto";
        const paramDeclarator = param.childForFieldName("declarator");
        let paramName = paramDeclarator?.text ?? `_p${i2}`;
        paramName = paramName.replace(/^[&*\s]+/, "").trim();
        params.push({ name: paramName, type: paramType });
      }
    }
    return params;
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // STATEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  visitCompoundStatementBody(node, isMain) {
    const lines = [];
    for (let i2 = 0; i2 < node.namedChildCount; i2++) {
      const child = node.namedChild(i2);
      const line = this.visitStatement(child, isMain);
      if (line !== null && line !== void 0) {
        lines.push(line);
      }
    }
    return lines.join("\n");
  }
  visitStatement(node, isMain = false) {
    switch (node.type) {
      case "declaration":
        return this.visitDeclaration(node);
      case "expression_statement":
        return this.visitExpressionStatement(node);
      case "return_statement":
        return this.visitReturnStatement(node, isMain);
      case "if_statement":
        return this.visitIfStatement(node);
      case "for_statement":
        return this.visitForStatement(node);
      case "for_range_loop":
        return this.visitForRangeLoop(node);
      case "struct_specifier":
      case "class_specifier":
        this.handleStructSpecifier(node);
        return "";
      case "while_statement":
        return this.visitWhileStatement(node);
      case "do_statement":
        return this.visitDoWhileStatement(node);
      case "switch_statement":
        return this.visitSwitchStatement(node);
      case "case_statement":
        return this.visitCaseStatement(node);
      case "compound_statement": {
        this.symbols.enterScope();
        const body2 = "{\n" + this.visitCompoundStatementBody(node, isMain) + "\n}";
        this.symbols.exitScope();
        return body2;
      }
      case "break_statement":
        return "break;";
      case "continue_statement":
        return "continue;";
      case "comment":
        return node.text;
      case "labeled_statement": {
        const label = node.child(0)?.text ?? "";
        const body2 = node.namedChildCount > 0 ? this.visitStatement(node.namedChild(node.namedChildCount - 1)) : "";
        return `${label}: ${body2}`;
      }
      default:
        this.warnUnsupported(node);
        return `// unsupported: ${node.type}`;
    }
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // DECLARATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  visitDeclaration(node) {
    const typeNode = node.childForFieldName("type");
    const typeText = typeNode?.text ?? "auto";
    let isConst = false;
    for (let i2 = 0; i2 < node.childCount; i2++) {
      const child = node.child(i2);
      if (child.type === "type_qualifier" && child.text === "const") {
        isConst = true;
      }
    }
    const cleanType = typeText.replace(/^(const\s+)?/, "").replace(/std::/g, "").trim();
    const containerInfo = this.parseContainerType(typeNode, cleanType);
    const results = [];
    for (let i2 = 0; i2 < node.namedChildCount; i2++) {
      const child = node.namedChild(i2);
      if (child.type === "init_declarator" || this.isDeclaratorType(child.type)) {
        const decl = this.visitInitDeclarator(child, cleanType, isConst, containerInfo);
        if (decl) results.push(decl);
      }
    }
    return results.join("\n");
  }
  isDeclaratorType(type) {
    return type === "identifier" || type === "array_declarator" || type === "pointer_declarator" || type === "reference_declarator" || type === "function_declarator";
  }
  visitInitDeclarator(node, cppType, isConst, containerInfo) {
    const keyword = isConst ? "const" : "let";
    if (node.type === "init_declarator") {
      const declarator = node.childForFieldName("declarator");
      const value = node.childForFieldName("value");
      const varName2 = this.extractDeclaratorName(declarator);
      this.symbols.declare(varName2, cppType, isConst);
      this.trackContainerVariable(varName2, cppType, containerInfo);
      if (declarator?.type === "array_declarator") {
        return this.handleArrayDeclarator(declarator, value, keyword, varName2);
      }
      if (value) {
        const jsValue = this.visitInitValue(value, cppType, containerInfo);
        if (CPP_INTEGER_TYPES.has(cppType) && !isConst) {
          return `${keyword} ${varName2} = ${this.wrapIntegerExpr(jsValue)};`;
        }
        return `${keyword} ${varName2} = ${jsValue};`;
      } else {
        const defaultVal2 = this.isStructType(cppType) && this.isPointerLikeDeclarator(declarator) ? "null" : this.getDefaultValue(cppType, containerInfo);
        return `${keyword} ${varName2} = ${defaultVal2};`;
      }
    }
    const varName = this.extractDeclaratorName(node);
    this.symbols.declare(varName, cppType, isConst);
    this.trackContainerVariable(varName, cppType, containerInfo);
    if (node.type === "array_declarator") {
      return this.handleArrayDeclarator(node, null, keyword, varName);
    }
    const defaultVal = this.isStructType(cppType) && this.isPointerLikeDeclarator(node) ? "null" : this.getDefaultValue(cppType, containerInfo);
    return `${keyword} ${varName} = ${defaultVal};`;
  }
  extractDeclaratorName(node) {
    if (!node) return "_unnamed";
    switch (node.type) {
      case "identifier":
        return node.text;
      case "array_declarator": {
        const inner = node.childForFieldName("declarator");
        return this.extractDeclaratorName(inner);
      }
      case "pointer_declarator":
      case "reference_declarator": {
        for (let i2 = 0; i2 < node.namedChildCount; i2++) {
          const child = node.namedChild(i2);
          const name2 = this.extractDeclaratorName(child);
          if (name2 !== "_unnamed") return name2;
        }
        return "_unnamed";
      }
      case "init_declarator": {
        const decl = node.childForFieldName("declarator");
        return this.extractDeclaratorName(decl);
      }
      default:
        return node.text.replace(/[&*]/g, "").trim();
    }
  }
  isPointerLikeDeclarator(node) {
    if (!node) return false;
    return node.type === "pointer_declarator" || node.type === "reference_declarator";
  }
  handleArrayDeclarator(declarator, value, keyword, varName) {
    const sizeNode = declarator.childForFieldName("size");
    const size = sizeNode?.text;
    const innerDecl = declarator.childForFieldName("declarator");
    if (innerDecl?.type === "array_declarator") {
      const innerSize = innerDecl.childForFieldName("size")?.text;
      const innerName = this.extractDeclaratorName(innerDecl);
      if (value) {
        const jsVal = this.visitInitializerList(value);
        return `${keyword} ${innerName} = ${jsVal};`;
      }
      if (size && innerSize) {
        return `${keyword} ${innerName} = Array(${innerSize}).fill(null).map(() => Array(${size}).fill(0));`;
      }
    }
    if (value) {
      const jsVal = this.visitInitializerList(value);
      return `${keyword} ${varName} = ${jsVal};`;
    }
    if (size) {
      return `${keyword} ${varName} = Array(${size}).fill(0);`;
    }
    return `${keyword} ${varName} = [];`;
  }
  visitInitValue(node, cppType, containerInfo) {
    const normalizedType = cppType.replace(/std::/g, "").trim();
    if (node.type === "initializer_list") {
      if (this.isStructType(normalizedType)) {
        return `${normalizedType}(${this.visitInitializerListElements(node)})`;
      }
      if (containerInfo?.kind === "set") {
        return `new Set([${this.visitInitializerListElements(node)}])`;
      }
      if (containerInfo?.kind === "map") {
        return this.visitMapInitList(node);
      }
      if (containerInfo?.kind === "pair") {
        return `[${this.visitInitializerListElements(node)}]`;
      }
      return this.visitInitializerList(node);
    }
    if (node.type === "argument_list") {
      if (this.isStructType(normalizedType)) {
        const args2 = this.visitArgumentList(node);
        return `${normalizedType}(${args2.join(", ")})`;
      }
      if (containerInfo?.kind === "vector") {
        const args2 = [];
        for (let i2 = 0; i2 < node.namedChildCount; i2++) {
          args2.push(this.visitExpression(node.namedChild(i2)));
        }
        if (args2.length === 2) {
          return `Array(${args2[0]}).fill(${args2[1]})`;
        }
        if (args2.length === 1) {
          return `Array(${args2[0]}).fill(0)`;
        }
      }
      if (containerInfo?.kind === "pair") {
        const args2 = [];
        for (let i2 = 0; i2 < node.namedChildCount; i2++) {
          args2.push(this.visitExpression(node.namedChild(i2)));
        }
        return `[${args2.join(", ")}]`;
      }
    }
    return this.visitExpression(node);
  }
  visitInitializerList(node) {
    const elements = [];
    for (let i2 = 0; i2 < node.namedChildCount; i2++) {
      const child = node.namedChild(i2);
      if (child.type === "comment") continue;
      if (child.type === "initializer_list") {
        elements.push(this.visitInitializerList(child));
      } else {
        elements.push(this.visitExpression(child));
      }
    }
    return `[${elements.join(", ")}]`;
  }
  visitInitializerListElements(node) {
    const elements = [];
    for (let i2 = 0; i2 < node.namedChildCount; i2++) {
      const child = node.namedChild(i2);
      if (child.type === "initializer_list") {
        elements.push(this.visitInitializerList(child));
      } else {
        elements.push(this.visitExpression(child));
      }
    }
    return elements.join(", ");
  }
  visitMapInitList(node) {
    const entries = [];
    for (let i2 = 0; i2 < node.namedChildCount; i2++) {
      const child = node.namedChild(i2);
      if (child.type === "initializer_list" && child.namedChildCount >= 2) {
        const key = this.visitExpression(child.namedChild(0));
        const val = this.visitExpression(child.namedChild(1));
        entries.push(`[${key}]: ${val}`);
      }
    }
    return `{${entries.join(", ")}}`;
  }
  getDefaultValue(cppType, containerInfo) {
    const normalizedType = cppType.replace(/std::/g, "").trim();
    if (containerInfo) {
      switch (containerInfo.kind) {
        case "vector":
          return "[]";
        case "map":
          return "{}";
        case "set":
          return "new Set()";
        case "pair":
          return "[0, 0]";
        case "stack":
        case "queue":
        case "priority_queue":
          return "[]";
      }
    }
    if (this.isStructType(normalizedType)) return `${normalizedType}()`;
    if (normalizedType === "string") return '""';
    if (normalizedType === "bool") return "false";
    if (normalizedType === "char") return "''";
    if (CPP_INTEGER_TYPES.has(normalizedType)) return "0";
    if (normalizedType === "float" || normalizedType === "double") return "0.0";
    return "0";
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTAINER TYPE PARSING
  // ═══════════════════════════════════════════════════════════════════════════
  parseContainerType(typeNode, cleanType) {
    if (!typeNode) return null;
    if (typeNode.type === "template_type") {
      const nameNode = typeNode.childForFieldName("name");
      const name2 = nameNode?.text?.replace(/std::/g, "") ?? "";
      if (name2 === "vector") return { kind: "vector" };
      if (name2 === "map" || name2 === "unordered_map") return { kind: "map" };
      if (name2 === "set" || name2 === "unordered_set") return { kind: "set" };
      if (name2 === "pair") return { kind: "pair" };
      if (name2 === "stack") return { kind: "stack" };
      if (name2 === "queue") return { kind: "queue" };
      if (name2 === "priority_queue") return { kind: "priority_queue" };
    }
    const stripped = cleanType.replace(/std::/g, "");
    if (stripped.startsWith("vector")) return { kind: "vector" };
    if (stripped.startsWith("map") || stripped.startsWith("unordered_map")) return { kind: "map" };
    if (stripped.startsWith("set") || stripped.startsWith("unordered_set")) return { kind: "set" };
    if (stripped.startsWith("pair")) return { kind: "pair" };
    if (stripped.startsWith("stack")) return { kind: "stack" };
    if (stripped.startsWith("queue")) return { kind: "queue" };
    if (stripped.startsWith("priority_queue")) return { kind: "priority_queue" };
    return null;
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // EXPRESSION STATEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  visitExpressionStatement(node) {
    const expr = node.namedChildCount > 0 ? node.namedChild(0) : null;
    if (!expr) return "";
    const js = this.visitExpression(expr);
    return js + ";";
  }
  visitReturnStatement(node, isMain) {
    const valueNode = node.namedChildCount > 0 ? node.namedChild(0) : null;
    if (isMain || this.insideMain) {
      if (valueNode && valueNode.text.trim() === "0") {
        return "// return 0;";
      }
    }
    if (valueNode) {
      return `return ${this.visitExpression(valueNode)};`;
    }
    return "return;";
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROL FLOW
  // ═══════════════════════════════════════════════════════════════════════════
  visitIfStatement(node) {
    const condNode = node.childForFieldName("condition");
    const consequent = node.childForFieldName("consequence");
    const alternate = node.childForFieldName("alternative");
    const cond = condNode ? this.visitConditionClause(condNode) : "true";
    let result = `if (${cond})`;
    if (consequent) {
      result += " " + this.visitStatementOrBlock(consequent);
    }
    if (alternate) {
      result += " else";
      const elseBody = alternate.namedChildCount > 0 ? alternate.namedChild(0) : null;
      if (elseBody) {
        if (elseBody.type === "if_statement") {
          result += " " + this.visitIfStatement(elseBody);
        } else {
          result += " " + this.visitStatementOrBlock(elseBody);
        }
      }
    }
    return result;
  }
  visitForStatement(node) {
    const init2 = node.childForFieldName("initializer");
    const cond = node.childForFieldName("condition");
    const update = node.childForFieldName("update");
    const body2 = node.childForFieldName("body");
    let initStr = "";
    if (init2) {
      if (init2.type === "declaration") {
        initStr = this.visitDeclaration(init2).replace(/;$/, "");
      } else {
        initStr = this.visitExpression(init2);
      }
    }
    const condStr = cond ? this.visitExpression(cond) : "";
    const updateStr = update ? this.visitExpression(update) : "";
    const bodyStr = body2 ? this.visitStatementOrBlock(body2) : "{}";
    return `for (${initStr}; ${condStr}; ${updateStr}) ${bodyStr}`;
  }
  visitForRangeLoop(node) {
    const declarator = node.childForFieldName("declarator");
    const right = node.childForFieldName("right");
    const body2 = node.childForFieldName("body");
    const varName = this.extractDeclaratorName(declarator);
    const container = right ? this.visitExpression(right) : "[]";
    const bodyStr = body2 ? this.visitStatementOrBlock(body2) : "{}";
    return `for (let ${varName} of ${container}) ${bodyStr}`;
  }
  visitWhileStatement(node) {
    const condNode = node.childForFieldName("condition");
    const body2 = node.childForFieldName("body");
    const cond = condNode ? this.visitConditionClause(condNode) : "true";
    const bodyStr = body2 ? this.visitStatementOrBlock(body2) : "{}";
    return `while (${cond}) ${bodyStr}`;
  }
  visitDoWhileStatement(node) {
    const body2 = node.childForFieldName("body");
    const condNode = node.childForFieldName("condition");
    const bodyStr = body2 ? this.visitStatementOrBlock(body2) : "{}";
    const cond = condNode ? this.visitConditionClause(condNode) : "true";
    return `do ${bodyStr} while (${cond});`;
  }
  visitSwitchStatement(node) {
    const condNode = node.childForFieldName("condition");
    const body2 = node.childForFieldName("body");
    const cond = condNode ? this.visitConditionClause(condNode) : "x";
    let bodyStr = "";
    if (body2) {
      bodyStr = "{\n";
      for (let i2 = 0; i2 < body2.namedChildCount; i2++) {
        bodyStr += this.visitStatement(body2.namedChild(i2)) + "\n";
      }
      bodyStr += "}";
    }
    return `switch (${cond}) ${bodyStr}`;
  }
  visitCaseStatement(node) {
    const valueNode = node.childForFieldName("value");
    const lines = [];
    if (valueNode) {
      lines.push(`case ${this.visitExpression(valueNode)}:`);
    } else {
      lines.push("default:");
    }
    for (let i2 = 0; i2 < node.namedChildCount; i2++) {
      const child = node.namedChild(i2);
      if (child === valueNode) continue;
      lines.push("  " + this.visitStatement(child));
    }
    return lines.join("\n");
  }
  visitConditionClause(node) {
    if (node.type === "condition_clause" || node.type === "parenthesized_expression") {
      if (node.namedChildCount > 0) {
        return this.visitExpression(node.namedChild(0));
      }
    }
    return this.visitExpression(node);
  }
  visitStatementOrBlock(node) {
    if (node.type === "compound_statement") {
      this.symbols.enterScope();
      const body2 = "{\n" + this.visitCompoundStatementBody(node, this.insideMain) + "\n}";
      this.symbols.exitScope();
      return body2;
    }
    return this.visitStatement(node);
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // EXPRESSIONS (the core — every expression returns a JS string)
  // ═══════════════════════════════════════════════════════════════════════════
  visitExpression(node) {
    switch (node.type) {
      case "number_literal":
        return node.text;
      case "string_literal":
        return node.text;
      case "concatenated_string": {
        const parts2 = [];
        for (let i2 = 0; i2 < node.namedChildCount; i2++) {
          parts2.push(node.namedChild(i2).text);
        }
        return parts2.join(" + ");
      }
      case "char_literal":
        return node.text;
      case "true":
        return "true";
      case "false":
        return "false";
      case "null":
        return "null";
      case "identifier":
        return this.visitIdentifier(node);
      case "qualified_identifier":
        return this.visitQualifiedIdentifier(node);
      case "binary_expression":
        return this.visitBinaryExpression(node);
      case "unary_expression":
        return this.visitUnaryExpression(node);
      case "update_expression":
        return node.text;
      // i++, i--, ++i, --i → identical in JS
      case "assignment_expression":
        return this.visitAssignmentExpression(node);
      case "call_expression":
        return this.visitCallExpression(node);
      case "field_expression":
        return this.visitFieldExpression(node);
      case "subscript_expression":
        return this.visitSubscriptExpression(node);
      case "parenthesized_expression": {
        const inner = node.namedChildCount > 0 ? node.namedChild(0) : null;
        if (inner) {
          return `(${this.visitExpression(inner)})`;
        }
        return node.text;
      }
      case "conditional_expression": {
        const cond = node.childForFieldName("condition");
        const cons = node.childForFieldName("consequence");
        const alt = node.childForFieldName("alternative");
        return `${cond ? this.visitExpression(cond) : "?"} ? ${cons ? this.visitExpression(cons) : ""} : ${alt ? this.visitExpression(alt) : ""}`;
      }
      case "comma_expression": {
        const parts2 = [];
        const left = node.childForFieldName("left");
        const right = node.childForFieldName("right");
        if (left) parts2.push(this.visitExpression(left));
        if (right) parts2.push(this.visitExpression(right));
        return parts2.join(", ");
      }
      case "cast_expression":
        return this.visitExpression(node.childForFieldName("value") ?? node.namedChild(node.namedChildCount - 1));
      case "sizeof_expression": {
        const valueNode = node.childForFieldName("value") || node.namedChild(0);
        if (valueNode && valueNode.type === "identifier") {
          return `(${valueNode.text}.length || 1)`;
        }
        return "1";
      }
      case "initializer_list":
        return this.visitInitializerList(node);
      case "template_function":
        return this.visitExpression(node.childForFieldName("name") ?? node.namedChild(0));
      case "compound_literal_expression":
        return this.visitExpression(node.namedChild(node.namedChildCount - 1));
      case "pointer_expression":
        return this.visitExpression(node.namedChild(node.namedChildCount - 1));
      case "user_defined_literal":
        return node.text;
      default:
        if (!SUPPORTED_NODE_TYPES.has(node.type)) {
          this.warnUnsupported(node);
        }
        return node.text;
    }
  }
  visitIdentifier(node) {
    const name2 = node.text;
    if (name2 in CPP_CONSTANTS) {
      return CPP_CONSTANTS[name2];
    }
    if (name2 === "npos") return "-1";
    return name2;
  }
  visitQualifiedIdentifier(node) {
    const text = node.text.replace(/std::/g, "");
    if (text === "npos" || text === "string::npos") return "-1";
    if (text in CPP_CONSTANTS) return CPP_CONSTANTS[text];
    return text;
  }
  // ─── Binary Expressions ────────────────────────────────────────────────────
  visitBinaryExpression(node) {
    const left = node.childForFieldName("left");
    const right = node.childForFieldName("right");
    const operator = node.childForFieldName("operator")?.text ?? "";
    if (!left || !right) return node.text;
    if (operator === "<<") {
      const coutResult = this.tryCoutChain(node);
      if (coutResult !== null) return coutResult;
    }
    if (operator === ">>") {
      const cinResult = this.tryCinChain(node);
      if (cinResult !== null) return cinResult;
    }
    const leftStr = this.visitExpression(left);
    const rightStr = this.visitExpression(right);
    if (operator === "==") return `${leftStr} === ${rightStr}`;
    if (operator === "!=") return `${leftStr} !== ${rightStr}`;
    return `${leftStr} ${operator} ${rightStr}`;
  }
  tryCoutChain(node) {
    const parts2 = [];
    let current = node;
    let streamName = "";
    while (current && current.type === "binary_expression") {
      const op = current.childForFieldName("operator")?.text;
      if (op !== "<<") break;
      const right = current.childForFieldName("right");
      if (right) {
        const rightText = right.text.replace(/std::/g, "").trim();
        if (rightText !== "endl" && rightText !== '"\\n"') {
          parts2.unshift(this.visitExpression(right));
        }
      }
      const left = current.childForFieldName("left");
      if (!left) break;
      if (left.type === "identifier" || left.type === "qualified_identifier") {
        const leftText = left.text.replace(/std::/g, "").trim();
        if (leftText === "cout") {
          streamName = "log";
          break;
        } else if (leftText === "cerr") {
          streamName = "error";
          break;
        }
      }
      current = left;
    }
    if (!streamName) return null;
    return `console.${streamName}(${parts2.join(", ")})`;
  }
  tryCinChain(node) {
    const vars = [];
    let current = node;
    let isCin = false;
    while (current && current.type === "binary_expression") {
      const op = current.childForFieldName("operator")?.text;
      if (op !== ">>") break;
      const right = current.childForFieldName("right");
      if (right) vars.unshift(this.visitExpression(right));
      const left = current.childForFieldName("left");
      if (!left) break;
      if (left.type === "identifier" || left.type === "qualified_identifier") {
        const leftText = left.text.replace(/std::/g, "").trim();
        if (leftText === "cin") {
          isCin = true;
          break;
        }
      }
      current = left;
    }
    if (!isCin) return null;
    return vars.map((v) => `${v} = __tracer.input()`).join("; ");
  }
  // ─── Assignment Expressions ─────────────────────────────────────────────────
  visitAssignmentExpression(node) {
    const left = node.childForFieldName("left");
    const right = node.childForFieldName("right");
    const operator = node.childForFieldName("operator")?.text ?? "=";
    if (!left || !right) return node.text;
    const leftStr = this.visitExpression(left);
    const rightStr = this.visitExpression(right);
    if (operator === "/=") {
      const varName = left.text.replace(/[&*]/g, "");
      if (this.symbols.isIntegerVariable(varName)) {
        return `${leftStr} = Math.trunc(${leftStr} / (${rightStr}))`;
      }
    }
    if (operator === "=" && left.type === "identifier") {
      const varName = left.text;
      if (this.symbols.isIntegerVariable(varName) && this.containsDivision(right)) {
        return `${leftStr} = Math.trunc(${rightStr})`;
      }
    }
    return `${leftStr} ${operator} ${rightStr}`;
  }
  containsDivision(node) {
    if (node.type === "binary_expression") {
      const op = node.childForFieldName("operator")?.text;
      if (op === "/") return true;
    }
    for (let i2 = 0; i2 < node.childCount; i2++) {
      if (this.containsDivision(node.child(i2))) return true;
    }
    return false;
  }
  // ─── Call Expressions ───────────────────────────────────────────────────────
  visitCallExpression(node) {
    const funcNode = node.childForFieldName("function");
    const argsNode = node.childForFieldName("arguments");
    if (!funcNode) return node.text;
    if (funcNode.type === "field_expression") {
      const objNode = funcNode.childForFieldName("argument");
      const methodNode = funcNode.childForFieldName("field");
      if (objNode && methodNode) {
        const obj = this.visitExpression(objNode);
        const method = methodNode.text;
        const args3 = argsNode ? this.visitArgumentList(argsNode) : [];
        const containerKind = this.getContainerKindForExpression(objNode);
        const isMinPriorityQueue = this.isMinPriorityQueueExpression(objNode);
        if (method === "size" || method === "length") return `${obj}.length`;
        if (method === "empty") return `(${obj}.length === 0)`;
        if (method === "front") return `${obj}[0]`;
        if (method === "back") return `${obj}[${obj}.length - 1]`;
        if (method === "top") {
          if (containerKind === "priority_queue") {
            this.ensurePriorityQueueHelpers();
            return `__cppPriorityQueueTop(${obj}, ${isMinPriorityQueue})`;
          }
          return `${obj}[${obj}.length - 1]`;
        }
        if (method === "push" && containerKind === "priority_queue") {
          this.ensurePriorityQueueHelpers();
          return `__cppPriorityQueuePush(${obj}, ${args3[0]}, ${isMinPriorityQueue})`;
        }
        if (method === "pop") {
          if (containerKind === "priority_queue") {
            this.ensurePriorityQueueHelpers();
            return `__cppPriorityQueuePop(${obj}, ${isMinPriorityQueue})`;
          }
          if (containerKind === "queue") {
            return `${obj}.shift()`;
          }
        }
        if (method === "push_back" || method === "emplace_back") return `${obj}.push(${args3.join(", ")})`;
        if (method === "pop_back") return `${obj}.pop()`;
        if (method === "clear") return `${obj}.length = 0`;
        if (method === "insert") {
          if (args3.length === 1) return `${obj}.add(${args3[0]})`;
          if (args3.length >= 2 && argsNode?.namedChild(0)?.text?.includes(".begin")) {
            return `${obj}.unshift(${args3[1]})`;
          }
          return `${obj}.add(${args3.join(", ")})`;
        }
        if (method === "erase") {
          if (args3.length === 1 && argsNode?.namedChild(0)?.text?.includes(".begin")) {
            return `${obj}.shift()`;
          }
          return `${obj}.splice(${args3.join(", ")})`;
        }
        if (method === "count") return `(${obj}.has ? (${obj}.has(${args3[0]}) ? 1 : 0) : (${args3[0]} in ${obj} ? 1 : 0))`;
        if (method === "find") return `${obj}.indexOf(${args3.join(", ")})`;
        if (method === "substr") {
          if (args3.length === 2) return `${obj}.substring(${args3[0]}, ${args3[0]} + ${args3[1]})`;
          return `${obj}.substring(${args3.join(", ")})`;
        }
        if (method === "begin" || method === "end") return `${obj}.${method}()`;
        return `${obj}.${method}(${args3.join(", ")})`;
      }
    }
    const funcText = funcNode.text.replace(/std::/g, "");
    const args2 = argsNode ? this.visitArgumentList(argsNode) : [];
    const memberCallMatch = funcText.match(/^([A-Za-z_]\w*)\.(\w+)$/);
    if (memberCallMatch) {
      const [, objName, method] = memberCallMatch;
      const containerKind = this.symbols.lookup(objName)?.containerKind ?? null;
      const symbol = this.symbols.lookup(objName);
      const isMinPriorityQueue = !!symbol && symbol.containerKind === "priority_queue" && /(?:^|[<,\s])greater(?:\s*<|$)/.test(symbol.cppType.replace(/std::/g, ""));
      if (method === "top" && containerKind === "priority_queue") {
        this.ensurePriorityQueueHelpers();
        return `__cppPriorityQueueTop(${objName}, ${isMinPriorityQueue})`;
      }
      if (method === "push" && containerKind === "priority_queue") {
        this.ensurePriorityQueueHelpers();
        return `__cppPriorityQueuePush(${objName}, ${args2[0]}, ${isMinPriorityQueue})`;
      }
      if (method === "pop") {
        if (containerKind === "priority_queue") {
          this.ensurePriorityQueueHelpers();
          return `__cppPriorityQueuePop(${objName}, ${isMinPriorityQueue})`;
        }
        if (containerKind === "queue") {
          return `${objName}.shift()`;
        }
      }
    }
    if (funcText === "sort" && args2.length >= 2) {
      const match = this.matchBeginEnd(argsNode);
      if (match) {
        if (args2.length === 3) {
          const third = argsNode.namedChild(2).text.replace(/std::/g, "");
          if (third.includes("greater")) {
            return `${match}.sort((a, b) => b - a)`;
          }
          return `${match}.sort(${args2[2]})`;
        }
        return `${match}.sort((a, b) => a - b)`;
      }
      if (argsNode && argsNode.namedChildCount >= 2) {
        const first = argsNode.namedChild(0).text;
        const second = argsNode.namedChild(1).text;
        if (second.includes(first + " +") || second.includes(first + "+")) {
          return `${first}.sort((a, b) => a - b)`;
        }
      }
    }
    if (funcText === "reverse" && args2.length >= 2) {
      const match = this.matchBeginEnd(argsNode);
      if (match) return `${match}.reverse()`;
    }
    if (funcText === "merge" && args2.length >= 5) {
      const match = this.matchMergeCall(argsNode);
      if (match) {
        this.ensureMergeHelper();
        const comparator = args2.length >= 6 ? `, ${args2[5]}` : "";
        return `${match.out}.splice(0, ${match.out}.length, ...__cppMergeSortedArrays(${match.left}, ${match.right}${comparator}))`;
      }
    }
    if (funcText === "swap" && args2.length === 2) {
      return `[${args2[0]}, ${args2[1]}] = [${args2[1]}, ${args2[0]}]`;
    }
    if (funcText === "find" && args2.length >= 3) {
      const match = this.matchBeginEnd(argsNode);
      if (match) return `${match}.indexOf(${args2[2]})`;
    }
    if (funcText === "accumulate" && args2.length >= 3) {
      const match = this.matchBeginEnd(argsNode);
      if (match) return `${match}.reduce((a, b) => a + b, ${args2[2]})`;
    }
    if (funcText === "fill" && args2.length >= 3) {
      const match = this.matchBeginEnd(argsNode);
      if (match) return `${match}.fill(${args2[2]})`;
    }
    if (funcText === "count" && args2.length >= 3) {
      const match = this.matchBeginEnd(argsNode);
      if (match) return `${match}.filter(x => x === ${args2[2]}).length`;
    }
    if (funcText === "min" && args2.length === 2) {
      return `Math.min(${args2[0]}, ${args2[1]})`;
    }
    if (funcText === "max" && args2.length === 2) {
      return `Math.max(${args2[0]}, ${args2[1]})`;
    }
    if (funcText in STL_MATH_FUNCTIONS) {
      return `${STL_MATH_FUNCTIONS[funcText]}(${args2.join(", ")})`;
    }
    if (funcText === "min_element" || funcText === "*min_element") {
      const match = this.matchBeginEnd(argsNode);
      if (match) return `Math.min(...${match})`;
    }
    if (funcText === "max_element" || funcText === "*max_element") {
      const match = this.matchBeginEnd(argsNode);
      if (match) return `Math.max(...${match})`;
    }
    if (funcText === "make_pair" && args2.length === 2) {
      return `[${args2[0]}, ${args2[1]}]`;
    }
    if (funcText === "to_string") return `String(${args2.join(", ")})`;
    if (funcText === "stoi") return `parseInt(${args2.join(", ")})`;
    if (funcText === "stof" || funcText === "stod") return `parseFloat(${args2.join(", ")})`;
    if (funcText === "getline" && args2.length >= 2) {
      const cinArg = args2[0].replace(/std::/g, "").trim();
      if (cinArg === "cin") {
        return `${args2[1]} = __tracer.input()`;
      }
    }
    if (funcText === "printf") {
      if (args2.length > 1) {
        return `console.log(${args2.slice(1).join(", ")})`;
      }
      return `console.log(${args2[0]})`;
    }
    if (funcText === "scanf") {
      return "/* scanf not supported in visualizer */";
    }
    return `${funcText}(${args2.join(", ")})`;
  }
  visitArgumentList(node) {
    const args2 = [];
    for (let i2 = 0; i2 < node.namedChildCount; i2++) {
      args2.push(this.visitExpression(node.namedChild(i2)));
    }
    return args2;
  }
  getContainerKindForExpression(node) {
    if (!node || node.type !== "identifier") return null;
    return this.symbols.lookup(node.text)?.containerKind ?? null;
  }
  isMinPriorityQueueExpression(node) {
    if (!node || node.type !== "identifier") return false;
    const symbol = this.symbols.lookup(node.text);
    if (!symbol || symbol.containerKind !== "priority_queue") return false;
    return /(?:^|[<,\s])greater(?:\s*<|$)/.test(symbol.cppType.replace(/std::/g, ""));
  }
  matchBeginCall(node) {
    const text = node.text.replace(/std::/g, "");
    const beginMatch = text.match(/^(\w+)\.begin\s*\(\s*\)$/);
    return beginMatch ? beginMatch[1] : null;
  }
  matchMergeCall(argsNode) {
    if (argsNode.namedChildCount < 5) return null;
    const leftBegin = this.matchBeginCall(argsNode.namedChild(0));
    const leftEnd = argsNode.namedChild(1).text.replace(/std::/g, "");
    const rightBegin = this.matchBeginCall(argsNode.namedChild(2));
    const rightEnd = argsNode.namedChild(3).text.replace(/std::/g, "");
    const outBegin = this.matchBeginCall(argsNode.namedChild(4));
    if (!leftBegin || !rightBegin || !outBegin) return null;
    if (!new RegExp(`^${leftBegin}\\.end\\s*\\(\\s*\\)$`).test(leftEnd)) return null;
    if (!new RegExp(`^${rightBegin}\\.end\\s*\\(\\s*\\)$`).test(rightEnd)) return null;
    return { left: leftBegin, right: rightBegin, out: outBegin };
  }
  /** Try to match pattern: v.begin(), v.end() → returns "v" */
  matchBeginEnd(argsNode) {
    if (argsNode.namedChildCount < 2) return null;
    const first = argsNode.namedChild(0);
    const second = argsNode.namedChild(1);
    const firstText = first.text.replace(/std::/g, "");
    const secondText = second.text.replace(/std::/g, "");
    const beginMatch = firstText.match(/^(\w+)\.begin\s*\(\s*\)$/);
    const endMatch = secondText.match(/^(\w+)\.end\s*\(\s*\)$/);
    if (beginMatch && endMatch && beginMatch[1] === endMatch[1]) {
      return beginMatch[1];
    }
    return null;
  }
  // ─── Field (Member) Expressions ─────────────────────────────────────────────
  visitFieldExpression(node) {
    const argument = node.childForFieldName("argument");
    const field = node.childForFieldName("field");
    if (!argument || !field) return node.text;
    const obj = this.visitExpression(argument);
    const member = field.text;
    const containerKind = this.getContainerKindForExpression(argument);
    const isMinPriorityQueue = this.isMinPriorityQueueExpression(argument);
    if (member in STL_METHOD_MAP) {
      return `${obj}.${STL_METHOD_MAP[member]}`;
    }
    if (member === "size" || member === "length") {
      return `${obj}.length`;
    }
    if (member === "empty") {
      return `(${obj}.length === 0)`;
    }
    if (member === "front") {
      return `${obj}[0]`;
    }
    if (member === "back") {
      return `${obj}[${obj}.length - 1]`;
    }
    if (member === "top") {
      if (containerKind === "priority_queue") {
        this.ensurePriorityQueueHelpers();
        return `__cppPriorityQueueTop(${obj}, ${isMinPriorityQueue})`;
      }
      return `${obj}[${obj}.length - 1]`;
    }
    if (member === "clear") {
      return `${obj}.length = 0`;
    }
    if (member === "begin" || member === "end") {
      return `${obj}.${member}`;
    }
    if (member === "first") return `${obj}[0]`;
    if (member === "second") return `${obj}[1]`;
    return `${obj}.${member}`;
  }
  // ─── Subscript Expressions ──────────────────────────────────────────────────
  visitSubscriptExpression(node) {
    const argument = node.childForFieldName("argument");
    const index = node.childForFieldName("index");
    if (!argument || !index) return node.text;
    return `${this.visitExpression(argument)}[${this.visitExpression(index)}]`;
  }
  // ─── Unary Expressions ──────────────────────────────────────────────────────
  visitUnaryExpression(node) {
    const operator = node.childForFieldName("operator")?.text ?? "";
    const operand = node.childForFieldName("argument");
    if (!operand) return node.text;
    if (operator === "*" || operator === "&") {
      return this.visitExpression(operand);
    }
    return `${operator}${this.visitExpression(operand)}`;
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════
  /** Wrap expression in Math.trunc if it contains division */
  wrapIntegerExpr(expr) {
    if (expr.includes("/") && !expr.includes("Math.trunc") && !expr.includes("Math.floor")) {
      return `Math.trunc(${expr})`;
    }
    return expr;
  }
  warnUnsupported(node) {
    this.warnings.warn(
      node.startPosition.row + 1,
      node.startPosition.column,
      node.type,
      `Unsupported C++ construct: ${node.type} \u2014 "${node.text.substring(0, 40)}..."`
    );
  }
};

// backend/sandbox/transpiler/generator.ts
function formatGeneratedCode(code) {
  let result = code;
  result = result.replace(/std::/g, "");
  result = result.replace(/\blet\s+&(\w+)/g, "let $1");
  result = result.replace(/\bconst\s+&(\w+)/g, "const $1");
  result = result.replace(/\.length\s*\(\s*\)/g, ".length");
  result = result.replace(/\((\w+)\.length === 0\)\s*\(\s*\)/g, "($1.length === 0)");
  result = result.replace(/\[0\]\s*\(\s*\)/g, "[0]");
  result = result.replace(/\[(\w+)\.length - 1\]\s*\(\s*\)/g, "[$1.length - 1]");
  result = result.replace(/\[(\w+)\.length - 1\]\s*\(\s*\)/g, "[$1.length - 1]");
  result = result.replace(/\n{3,}/g, "\n\n");
  result = result.trim();
  return result;
}

// backend/sandbox/legacy/regexTranspiler.ts
function findMatchingBrace(code, openIndex) {
  let depth = 0;
  let inString = false;
  let inChar = false;
  let stringChar = "";
  for (let i2 = openIndex; i2 < code.length; i2++) {
    const ch = code[i2];
    const prev = i2 > 0 ? code[i2 - 1] : "";
    if (!inChar && ch === '"' && prev !== "\\") {
      inString = !inString;
      continue;
    }
    if (!inString && ch === "'" && prev !== "\\") {
      inChar = !inChar;
      continue;
    }
    if (inString || inChar) continue;
    if (ch === "/" && i2 + 1 < code.length && code[i2 + 1] === "/") {
      const eol = code.indexOf("\n", i2);
      if (eol === -1) return -1;
      i2 = eol;
      continue;
    }
    if (ch === "/" && i2 + 1 < code.length && code[i2 + 1] === "*") {
      const end = code.indexOf("*/", i2 + 2);
      if (end === -1) return -1;
      i2 = end + 1;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return i2;
    }
  }
  return -1;
}
function parseCoutArgs(argsStr) {
  const parts2 = [];
  let current = "";
  let parenDepth = 0;
  for (let i2 = 0; i2 < argsStr.length; i2++) {
    const ch = argsStr[i2];
    if (ch === "(") parenDepth++;
    if (ch === ")") parenDepth--;
    if (parenDepth === 0 && ch === "<" && i2 + 1 < argsStr.length && argsStr[i2 + 1] === "<") {
      const trimmed2 = current.trim();
      if (trimmed2) parts2.push(trimmed2);
      current = "";
      i2++;
      continue;
    }
    current += ch;
  }
  const trimmed = current.trim();
  if (trimmed) parts2.push(trimmed);
  const filtered = parts2.filter((p) => {
    const clean = p.trim();
    return clean !== "endl" && clean !== "std::endl";
  });
  return filtered.join(", ");
}
function transpileCppToJs(cppCode) {
  let js = cppCode;
  const queueVars = /* @__PURE__ */ new Set();
  const priorityQueueVars = /* @__PURE__ */ new Map();
  let usesMergeHelper = false;
  const preserveLines = (match2, replacer = "") => {
    const newlines = (match2.match(/\n/g) || []).length;
    return replacer + "\n".repeat(newlines);
  };
  js = js.replace(/#include\s*<[^>]*>/g, (m) => preserveLines(m, "// include placeholder"));
  js = js.replace(/#include\s*"[^"]*"/g, (m) => preserveLines(m, "// include placeholder"));
  js = js.replace(/#define\s+(\w+)\s+(.+)/g, "const $1 = $2;");
  js = js.replace(/using\s+namespace\s+std\s*;/g, (m) => preserveLines(m, "// namespace placeholder"));
  js = js.replace(/typedef\s+[\w\s]+\s+(\w+)\s*;/g, (m) => preserveLines(m, "// typedef placeholder"));
  js = js.replace(/using\s+\w+\s*=\s*[^;]+;/g, (m) => preserveLines(m, "// using alias placeholder"));
  const functionBodies = [];
  let mainBody = "";
  const funcRegex = /(?:^|\n)(\s*)(?:(?:(?:inline|constexpr|static|virtual)\s+)?(?:void|int|float|double|string|bool|char|long|auto|long\s+long|unsigned\s+int|short)\s+)(\w+)\s*\(([^)]*)\)\s*\{/g;
  let match;
  const processedCode = js;
  const functions = [];
  funcRegex.lastIndex = 0;
  while ((match = funcRegex.exec(processedCode)) !== null) {
    const indent = match[1];
    const funcName = match[2];
    const params = match[3];
    const openBraceIndex = processedCode.indexOf("{", match.index + match[0].length - 1);
    if (openBraceIndex === -1) continue;
    const closeBraceIndex = findMatchingBrace(processedCode, openBraceIndex);
    if (closeBraceIndex === -1) continue;
    const body2 = processedCode.substring(openBraceIndex + 1, closeBraceIndex);
    const fullMatch = processedCode.substring(match.index, closeBraceIndex + 1);
    functions.push({
      name: funcName,
      params,
      body: body2,
      fullMatch,
      startIndex: match.index,
      openBraceIndex,
      closeBraceIndex,
      indent
    });
  }
  functions.sort((a, b) => b.startIndex - a.startIndex);
  for (const func2 of functions) {
    const { name: name2, params, startIndex, openBraceIndex, closeBraceIndex, indent } = func2;
    if (name2 === "main") {
      const beforeSig = js.substring(0, startIndex);
      const signature = js.substring(startIndex, openBraceIndex + 1);
      const insideBody = js.substring(openBraceIndex + 1, closeBraceIndex);
      const afterBody = js.substring(closeBraceIndex + 1);
      const commentedSignature = signature.replace(/([\w\\]+.*)/s, "// $1");
      const modifiedBody = insideBody.replace(/return\s+0\s*;/g, "// return 0;");
      js = beforeSig + commentedSignature + modifiedBody + "// }" + afterBody;
    } else {
      const jsParams = params.split(",").map((p) => {
        const trimmed = p.trim();
        if (!trimmed) return "";
        const parts2 = trimmed.replace(/&/g, "").trim().split(/\s+/);
        return parts2[parts2.length - 1];
      }).filter(Boolean).join(", ");
      const beforeSig = js.substring(0, startIndex);
      const signature = js.substring(startIndex, openBraceIndex + 1);
      const afterSig = js.substring(openBraceIndex + 1);
      const sigNewlines = (signature.match(/\n/g) || []).join("");
      const jsSignature = `${sigNewlines}${indent}function ${name2}(${jsParams}) {`;
      js = beforeSig + jsSignature + afterSig;
    }
  }
  js = js.replace(/(?:std::)?vector\s*<\s*(?:std::)?vector\s*<[^>]+>\s*>\s+(\w+)\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name2, init2) => {
    const converted = init2.replace(/\{/g, "[").replace(/\}/g, "]");
    return `let ${name2} = [${converted}];`;
  });
  js = js.replace(/(?:std::)?vector\s*<\s*(?:std::)?vector\s*<[^>]+>\s*>\s+(\w+)\s*;/g, "let $1 = [];");
  js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name2, init2) => {
    const converted = init2.replace(/\{/g, "[").replace(/\}/g, "]");
    return `let ${name2} = [${converted}];`;
  });
  js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*;/g, "let $1 = [];");
  js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*\(([^,]+),\s*([^)]+)\)\s*;/g, "let $1 = Array($2).fill($3);");
  js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*\(([^)]+)\)\s*;/g, "let $1 = Array($2).fill(0);");
  js = js.replace(/(?:std::)?(?:unordered_)?map\s*<[^>]+>\s+(\w+)\s*;/g, "let $1 = new Map();");
  js = js.replace(/(?:std::)?(?:unordered_)?map\s*<[^>]+>\s+(\w+)\s*=\s*\{([^}]*)\}\s*;/g, (_, name2, init2) => {
    const converted = init2.replace(/\{/g, "[").replace(/\}/g, "]");
    return `let ${name2} = new Map([${converted}]);`;
  });
  js = js.replace(/(?:std::)?(?:unordered_)?set\s*<[^>]+>\s+(\w+)\s*;/g, "let $1 = new Set();");
  js = js.replace(/(?:std::)?(?:unordered_)?set\s*<[^>]+>\s+(\w+)\s*=\s*\{([^}]*)\}\s*;/g, "let $1 = new Set([$2]);");
  js = js.replace(/(?:std::)?pair\s*<[^>]+>\s+(\w+)\s*=\s*\{([^}]*)\}\s*;/g, "let $1 = [$2];");
  js = js.replace(/(?:std::)?pair\s*<[^>]+>\s+(\w+)\s*\(([^)]*)\)\s*;/g, "let $1 = [$2];");
  js = js.replace(/(?:std::)?pair\s*<[^>]+>\s+(\w+)\s*;/g, "let $1 = [0, 0];");
  js = js.replace(/(?:std::)?make_pair\s*\(([^,]+),\s*([^)]+)\)/g, "[$1, $2]");
  js = js.replace(/(?:std::)?stack\s*<[^>]+>\s+(\w+)\s*;/g, "let $1 = [];");
  js = js.replace(/(?:std::)?queue\s*<[^>]+>\s+(\w+)\s*;/g, (_, name2) => {
    queueVars.add(name2);
    return `let ${name2} = [];`;
  });
  js = js.replace(/(?:std::)?priority_queue\s*<([^;]+)>\s+(\w+)\s*;/g, (_, typeSpec, name2) => {
    const normalizedType = String(typeSpec).replace(/std::/g, "");
    priorityQueueVars.set(name2, /(?:^|[<,\s])greater(?:\s*<|$)/.test(normalizedType));
    return `let ${name2} = [];`;
  });
  js = js.replace(/for\s*\(\s*(?:const\s+)?(?:auto|int|float|double|string|char|long|long\s+long|unsigned\s+int|short|bool)\s*&?\s+(\w+)\s*:\s*/g, "for (let $1 of ");
  js = js.replace(/\b(int|long\s+long|long|short|unsigned\s+int)\s+(\w+)\s*=\s*([^;{]+?)\s*;/g, (match2, type, varName, expr) => {
    if (expr.includes('"') || expr.includes("'") || expr.includes("[")) return `let ${varName} = ${expr};`;
    return `let ${varName} = Math.trunc(${expr});`;
  });
  js = js.replace(/(\w+(?:\[[^\]]*\])?)\s*\/\=\s*([^;]+);/g, "$1 = Math.trunc($1 / ($2));");
  js = js.replace(/^(\s*)(\w+)\s*=\s*([^;]*\/[^;]+);/gm, (match2, space, varName, expr) => {
    if (expr.includes("Math.") || expr.includes(".0")) return match2;
    return `${space}${varName} = Math.trunc(${expr});`;
  });
  js = js.replace(/\bconst\s+(?:int|float|double|string|bool|char|auto|long|short|long\s+long|unsigned\s+int)\s+/g, "const ");
  const types = [
    "long\\s+long",
    "unsigned\\s+int",
    "int",
    "float",
    "double",
    "string",
    "bool",
    "char",
    "auto",
    "long",
    "short"
  ];
  const typeRegex = new RegExp(`\\b(${types.join("|")})\\s+`, "g");
  js = js.replace(typeRegex, "let ");
  js = js.replace(
    /let\s+(\w+)\[(\d+)\]\[(\d+)\]\s*;/g,
    "let $1 = Array($2).fill(null).map(() => Array($3).fill(0));"
  );
  js = js.replace(/let\s+(\w+)\[\d+\]\[\d+\]\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name2, init2) => {
    const converted = init2.replace(/\{/g, "[").replace(/\}/g, "]");
    return `let ${name2} = [${converted}];`;
  });
  js = js.replace(/let\s+(\w+)\[\]\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name2, init2) => {
    return `let ${name2} = [${init2.replace(/\{/g, "[").replace(/\}/g, "]")}];`;
  });
  js = js.replace(/let\s+(\w+)\[\d+\]\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name2, init2) => {
    return `let ${name2} = [${init2.replace(/\{/g, "[").replace(/\}/g, "]")}];`;
  });
  js = js.replace(/let\s+(\w+)\[(\d+)\]\s*;/g, "let $1 = Array($2).fill(0);");
  js = js.replace(/(?:std::)?cout\s*<<\s*(.*);/g, (_, args2) => {
    const parsed = parseCoutArgs(args2);
    if (!parsed) return "// empty cout";
    return `console.log(${parsed});`;
  });
  js = js.replace(/(?:std::)?cerr\s*<<\s*(.*);/g, (_, args2) => {
    const parsed = parseCoutArgs(args2);
    if (!parsed) return "// empty cerr";
    return `console.error(${parsed});`;
  });
  js = js.replace(/(?:std::)?cin\s*>>\s*(.*);/g, (_, args2) => {
    const vars = args2.split(">>").map((v) => v.trim()).filter(Boolean);
    return vars.map((v) => `${v} = __tracer.input();`).join(" ");
  });
  js = js.replace(/printf\s*\(\s*"([^"]*)"(?:\s*,\s*([^)]*))?\)\s*;/g, (_, fmt, args2) => {
    if (args2) {
      return `console.log(${args2.trim()});`;
    }
    return `console.log("${fmt}");`;
  });
  js = js.replace(/scanf\s*\([^)]*\)\s*;/g, "// scanf not supported in visualizer");
  js = js.replace(/\.push_back\s*\(/g, ".push(");
  js = js.replace(/\.pop_back\s*\(\s*\)/g, ".pop()");
  js = js.replace(/\.emplace_back\s*\(/g, ".push(");
  js = js.replace(/\.size\s*\(\s*\)/g, ".length");
  js = js.replace(/\.length\s*\(\s*\)/g, ".length");
  js = js.replace(/(\w+)\.empty\s*\(\s*\)/g, "($1.length === 0)");
  js = js.replace(/\.front\s*\(\s*\)/g, "[0]");
  js = js.replace(/\.back\s*\(\s*\)/g, "[this.length - 1]");
  js = js.replace(/(\w+)\[this\.length - 1\]/g, "$1[$1.length - 1]");
  js = js.replace(/\.clear\s*\(\s*\)/g, ".length = 0");
  js = js.replace(/\.erase\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*\)/g, ".shift()");
  js = js.replace(/\.insert\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*/g, ".unshift(");
  js = js.replace(/(\w+)\.count\s*\(([^)]+)\)/g, "($1.has ? ($1.has($2) ? 1 : 0) : ($2 in $1 ? 1 : 0))");
  js = js.replace(/(\w+)\.find\s*\(([^)]+)\)\s*!=\s*\1\.end\s*\(\s*\)/g, "$1.has($2)");
  js = js.replace(/(\w+)\.find\s*\(([^)]+)\)\s*==\s*\1\.end\s*\(\s*\)/g, "!$1.has($2)");
  js = js.replace(/\.insert\s*\((?!(\w+)\.begin)/g, ".add(");
  js = js.replace(/(\w+)\.top\s*\(\s*\)/g, "$1[$1.length - 1]");
  queueVars.forEach((name2) => {
    const escaped = name2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    js = js.replace(new RegExp(`\\b${escaped}\\.pop\\s*\\(\\s*\\)`, "g"), `${name2}.shift()`);
  });
  priorityQueueVars.forEach((isMinQueue, name2) => {
    const escaped = name2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    js = js.replace(new RegExp(`\\b${escaped}\\.push\\s*\\(([^()]*(?:\\([^)]*\\)[^()]*)*)\\)`, "g"), `__cppPriorityQueuePush(${name2}, $1, ${isMinQueue})`);
    js = js.replace(new RegExp(`\\b${escaped}\\.top\\s*\\(\\s*\\)`, "g"), `__cppPriorityQueueTop(${name2}, ${isMinQueue})`);
    js = js.replace(new RegExp(`\\b${escaped}\\.pop\\s*\\(\\s*\\)`, "g"), `__cppPriorityQueuePop(${name2}, ${isMinQueue})`);
  });
  js = js.replace(/\.first\b/g, "[0]");
  js = js.replace(/\.second\b/g, "[1]");
  js = js.replace(/(\w+)\.substr\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, "$1.substring($2, $2 + $3)");
  js = js.replace(/\.substr\s*\(/g, ".substring(");
  js = js.replace(/(\w+)\.find\s*\(([^)]+)\)(?!\s*[!=]=)/g, "$1.indexOf($2)");
  js = js.replace(/(?:std::)?string::npos/g, "-1");
  js = js.replace(/to_string\s*\(/g, "String(");
  js = js.replace(/stoi\s*\(/g, "parseInt(");
  js = js.replace(/sto[fd]\s*\(/g, "parseFloat(");
  js = js.replace(/getline\s*\(\s*(?:std::)?cin\s*,\s*(\w+)\s*\)/g, "$1 = __tracer.input()");
  js = js.replace(
    /(?:std::)?sort\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
    "$1.sort((a, b) => a - b)"
  );
  js = js.replace(
    /(?:std::)?sort\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*(?:std::)?greater\s*<[^>]*>\s*\(\s*\)\s*\)/g,
    "$1.sort((a, b) => b - a)"
  );
  js = js.replace(
    /(?:std::)?sort\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*(\w+)\s*\)/g,
    "$1.sort($2)"
  );
  js = js.replace(
    /(?:std::)?sort\s*\(\s*(\w+)\s*,\s*\1\s*\+\s*(\w+)\s*\)/g,
    "$1.sort((a, b) => a - b)"
  );
  js = js.replace(
    /(?:std::)?reverse\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
    "$1.reverse()"
  );
  js = js.replace(
    /(?:std::)?merge\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\2\.end\s*\(\s*\)\s*,\s*(\w+)\.begin\s*\(\s*\)\s*\)/g,
    (_, left, right, out2) => {
      usesMergeHelper = true;
      return `${out2}.splice(0, ${out2}.length, ...__cppMergeSortedArrays(${left}, ${right}))`;
    }
  );
  js = js.replace(
    /(?:std::)?swap\s*\(\s*(\w+(?:\[[^\]]*\])?)\s*,\s*(\w+(?:\[[^\]]*\])?)\s*\)\s*;/g,
    "[$1, $2] = [$2, $1];"
  );
  js = js.replace(
    /(?:std::)?find\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
    "$1.indexOf($2)"
  );
  js = js.replace(
    /(?:std::)?accumulate\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
    "$1.reduce((a, b) => a + b, $2)"
  );
  js = js.replace(
    /\*\s*(?:std::)?min_element\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
    "Math.min(...$1)"
  );
  js = js.replace(
    /\*\s*(?:std::)?max_element\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
    "Math.max(...$1)"
  );
  js = js.replace(
    /(?:std::)?fill\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
    "$1.fill($2)"
  );
  js = js.replace(
    /(?:std::)?count\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
    "$1.filter(x => x === $2).length"
  );
  js = js.replace(/(?:std::)?min\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, "Math.min($1, $2)");
  js = js.replace(/(?:std::)?max\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, "Math.max($1, $2)");
  js = js.replace(/(?<!\.)(?:\b)abs\s*\(/g, "Math.abs(");
  js = js.replace(/(?<!\.)(?:\b)pow\s*\(/g, "Math.pow(");
  js = js.replace(/(?<!\.)(?:\b)sqrt\s*\(/g, "Math.sqrt(");
  js = js.replace(/(?<!\.)(?:\b)ceil\s*\(/g, "Math.ceil(");
  js = js.replace(/(?<!\.)(?:\b)floor\s*\(/g, "Math.floor(");
  js = js.replace(/(?<!\.)(?:\b)log\s*\(/g, "Math.log(");
  js = js.replace(/(?<!\.)(?:\b)log2\s*\(/g, "Math.log2(");
  js = js.replace(/(?<!\.)(?:\b)log10\s*\(/g, "Math.log10(");
  js = js.replace(/(?<!\.)(?:\b)round\s*\(/g, "Math.round(");
  js = js.replace(/\bINT_MAX\b/g, "Number.MAX_SAFE_INTEGER");
  js = js.replace(/\bINT_MIN\b/g, "Number.MIN_SAFE_INTEGER");
  js = js.replace(/\bLLONG_MAX\b/g, "Number.MAX_SAFE_INTEGER");
  js = js.replace(/\bLLONG_MIN\b/g, "Number.MIN_SAFE_INTEGER");
  js = js.replace(/\bnullptr\b/g, "null");
  js = js.replace(/\bNULL\b/g, "null");
  js = js.replace(/\btrue\b/g, "true");
  js = js.replace(/\bfalse\b/g, "false");
  js = js.replace(/std::/g, "");
  js = js.replace(/\blet\s+&(\w+)/g, "let $1");
  js = js.replace(/\bconst\s+&(\w+)/g, "const $1");
  js = js.replace(/\n{3,}/g, "\n\n");
  js = js.trim();
  const helperBlocks = [];
  if (usesMergeHelper) {
    helperBlocks.push(`
function __cppMergeSortedArrays(left, right, comparator) {
    const merged = [];
    let leftIndex = 0;
    let rightIndex = 0;
    const compare = comparator || ((a, b) => a <= b);

    while (leftIndex < left.length && rightIndex < right.length) {
        if (compare(left[leftIndex], right[rightIndex])) {
            merged.push(left[leftIndex++]);
        } else {
            merged.push(right[rightIndex++]);
        }
    }

    while (leftIndex < left.length) merged.push(left[leftIndex++]);
    while (rightIndex < right.length) merged.push(right[rightIndex++]);

    return merged;
}`.trim());
  }
  if (priorityQueueVars.size > 0) {
    helperBlocks.push(`
function __cppComparePriorityQueueValues(left, right) {
    if (Array.isArray(left) && Array.isArray(right)) {
        const length = Math.max(left.length, right.length);
        for (let index = 0; index < length; index++) {
            const leftValue = left[index];
            const rightValue = right[index];
            if (leftValue === rightValue) continue;
            if (leftValue === undefined) return -1;
            if (rightValue === undefined) return 1;
            return leftValue < rightValue ? -1 : 1;
        }
        return 0;
    }

    if (left === right) return 0;
    return left < right ? -1 : 1;
}

function __cppPriorityQueuePush(queue, value, isMinQueue) {
    queue.push(value);
    queue.sort((left, right) => {
        const comparison = __cppComparePriorityQueueValues(left, right);
        return isMinQueue ? comparison : -comparison;
    });
    return queue.length;
}

function __cppPriorityQueueTop(queue, isMinQueue) {
    if (queue.length === 0) return undefined;
    return isMinQueue ? queue[0] : queue[queue.length - 1];
}

function __cppPriorityQueuePop(queue, isMinQueue) {
    if (queue.length === 0) return undefined;
    return isMinQueue ? queue.shift() : queue.pop();
}`.trim());
  }
  if (helperBlocks.length > 0) {
    js = `${helperBlocks.join("\n\n")}

${js}`.trim();
  }
  return js;
}

// backend/sandbox/transpiler/index.ts
var currentMode = "ast";
var initDone = false;
function transpileCppToJs2(cppCode) {
  if (!initDone || currentMode === "regex") {
    return transpileCppToJs(cppCode);
  }
  try {
    if (!isParserReady()) {
      return transpileCppToJs(cppCode);
    }
    const tree = parseCpp(cppCode);
    const transformer = new CppToJsTransformer();
    const { code, warnings } = transformer.transform(tree);
    const formatted = formatGeneratedCode(code);
    if (warnings.length > 0) {
      console.warn(`[Transpiler] ${warnings.length} warning(s):`, warnings);
    }
    return formatted;
  } catch (error) {
    console.warn(
      "[Transpiler] AST transpilation failed, falling back to regex:",
      error instanceof Error ? error.message : String(error)
    );
    return transpileCppToJs(cppCode);
  }
}

// test_transpiler.ts
async function test() {
  await initParser();
  const cpp = `
#include <iostream>
using namespace std;

bool findPair(int a[],int n,int z)
{
    for (int i=0;i<n;i++){
        for (int j=i+1;j<n;j++){
            if(a[i]+a[j]==z){
                return true;
            }
        }
    }
    return false;
};

class User {
public:
  int id;
  User() { id = 0; }
  void printId() { cout << id << endl; }
};

int main(){
    int a[]= {1,-2,1,0,5};
    int z = -1;
    int n = sizeof(a)/sizeof(a[0]);

    if (findPair(a,n,z)){
        cout<<"Pair found";
    }
    else{
        cout<<"Pair not found";
    }

    User u;
    u.id = 1;
    u.printId();
}
  `;
  const js = transpileCppToJs2(cpp);
  console.log("=== TRANPILED JS ===");
  console.log(js);
}
test().catch(console.error);
