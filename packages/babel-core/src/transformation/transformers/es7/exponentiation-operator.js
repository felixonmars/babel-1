// https://github.com/rwaldron/exponentiation-operator

import build from "../../helpers/build-binary-assignment-operator-transformer";
import * as t from "babel-types";

export let metadata = {
  stage: 2
};

export let visitor = build({
  operator: "**",

  build(left, right) {
    return t.callExpression(t.memberExpression(t.identifier("Math"), t.identifier("pow")), [left, right]);
  }
});
