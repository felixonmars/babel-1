import isInteger from "is-integer";
import isNumber from "lodash/lang/isNumber";
import * as t from "babel-types";

const SCIENTIFIC_NOTATION = /e/i;

export function UnaryExpression(node, print) {
  let needsSpace = /[a-z]$/.test(node.operator);
  let arg = node.argument;

  if (t.isUpdateExpression(arg) || t.isUnaryExpression(arg)) {
    needsSpace = true;
  }

  if (t.isUnaryExpression(arg) && arg.operator === "!") {
    needsSpace = false;
  }

  this.push(node.operator);
  if (needsSpace) this.push(" ");
  print.plain(node.argument);
}

export function DoExpression(node, print) {
  this.push("do");
  this.space();
  print.plain(node.body);
}

export function ParenthesizedExpression(node, print) {
  this.push("(");
  print.plain(node.expression);
  this.push(")");
}

export function UpdateExpression(node, print) {
  if (node.prefix) {
    this.push(node.operator);
    print.plain(node.argument);
  } else {
    print.plain(node.argument);
    this.push(node.operator);
  }
}

export function ConditionalExpression(node, print) {
  print.plain(node.test);
  this.space();
  this.push("?");
  this.space();
  print.plain(node.consequent);
  this.space();
  this.push(":");
  this.space();
  print.plain(node.alternate);
}

export function NewExpression(node, print) {
  this.push("new ");
  print.plain(node.callee);
  this.push("(");
  print.list(node.arguments);
  this.push(")");
}

export function SequenceExpression(node, print) {
  print.list(node.expressions);
}

export function ThisExpression() {
  this.push("this");
}

export function Super() {
  this.push("super");
}

export function Decorator(node, print) {
  this.push("@");
  print.plain(node.expression);
  this.newline();
}

export function CallExpression(node, print) {
  print.plain(node.callee);

  this.push("(");

  let isPrettyCall = node._prettyCall && !this.format.retainLines && !this.format.compact;

  let separator;
  if (isPrettyCall) {
    separator = ",\n";
    this.newline();
    this.indent();
  }

  print.list(node.arguments, { separator });

  if (isPrettyCall) {
    this.newline();
    this.dedent();
  }

  this.push(")");
}

function buildYieldAwait(keyword) {
  return function (node, print) {
    this.push(keyword);

    if (node.delegate || node.all) {
      this.push("*");
    }

    if (node.argument) {
      this.push(" ");
      let terminatorState = this.startTerminatorless();
      print.plain(node.argument);
      this.endTerminatorless(terminatorState);
    }
  };
}

export let YieldExpression = buildYieldAwait("yield");
export let AwaitExpression = buildYieldAwait("await");

export function EmptyStatement() {
  this.semicolon();
}

export function ExpressionStatement(node, print) {
  print.plain(node.expression);
  this.semicolon();
}

export function AssignmentPattern(node, print) {
  print.plain(node.left);
  this.push(" = ");
  print.plain(node.right);
}

export function AssignmentExpression(node, print) {
  // todo: add cases where the spaces can be dropped when in compact mode
  print.plain(node.left);

  let spaces = node.operator === "in" || node.operator === "instanceof";
  spaces = true; // todo: https://github.com/babel/babel/issues/1835
  this.space(spaces);

  this.push(node.operator);

  if (!spaces) {
    // space is mandatory to avoid outputting <!--
    // http://javascript.spec.whatwg.org/#comment-syntax
    spaces = node.operator === "<" &&
             t.isUnaryExpression(node.right, { prefix: true, operator: "!" }) &&
             t.isUnaryExpression(node.right.argument, { prefix: true, operator: "--" });
  }

  this.space(spaces);

  print.plain(node.right);
}

export function BindExpression(node, print) {
  print.plain(node.object);
  this.push("::");
  print.plain(node.callee);
}

export {
  AssignmentExpression as BinaryExpression,
  AssignmentExpression as LogicalExpression
};

export function MemberExpression(node, print) {
  let obj = node.object;
  print.plain(obj);

  if (!node.computed && t.isMemberExpression(node.property)) {
    throw new TypeError("Got a MemberExpression for MemberExpression property");
  }

  let computed = node.computed;
  if (t.isLiteral(node.property) && isNumber(node.property.value)) {
    computed = true;
  }

  if (computed) {
    this.push("[");
    print.plain(node.property);
    this.push("]");
  } else {
    if (t.isLiteral(node.object)) {
      let val = this._Literal(node.object);
      if (isInteger(+val) && !SCIENTIFIC_NOTATION.test(val) && !this.endsWith(".")) {
        this.push(".");
      }
    }

    this.push(".");
    print.plain(node.property);
  }
}

export function MetaProperty(node, print) {
  print.plain(node.meta);
  this.push(".");
  print.plain(node.property);
}
