/* eslint-disable no-console */
const toType = (obj) => {
  try {
      return Object.prototype.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  } catch(err) {
      console.log("Exception in toType. Should not happen");  //typically occurs if obj passed is undefined in node or windows namespace
      console.log(err);
      return "undefined";
  }
}

const isTypeString = (...ao)=>ao.every(o=>toType(o) === 'string') 
const isTypeArray = (...ao)=>ao.every(o=>toType(o) === 'array')
const isTypeObject = (...ao)=>ao.every(o=>toType(o) === 'object')
const isTypeNumber = (...ao)=>ao.every(o=>toType(o) === 'number' && !isNaN(o))
const isTypeBoolean = (...ao)=>ao.every(o=>toType(o) === 'boolean')
const isTypeFunction = (...ao)=>ao.every(o=>toType(o) === 'function'||toType(o) === 'asyncfunction')
const isTypeAsyncFunction = (...ao)=>ao.every(o=>toType(o) === 'asyncfunction')
const isTypeDate = (...ao)=>ao.every(o=>toType(o) === 'date')
const isTypeRegExp = (...ao)=>ao.every(o=>toType(o) === 'regexp')
const isTypeError = (...ao)=>ao.every(o=>toType(o) === 'error')

module.exports = {
  toType,
  isTypeArray,
  isTypeBoolean,
  isTypeDate,
  isTypeObject,
  isTypeRegExp,
  isTypeError,
  isTypeFunction,
  isTypeNumber,
  isTypeString,
  isTypeAsyncFunction
}
