const { XMLParser, XMLValidator } = require("fast-xml-parser");

const validateXmlBody = (xmlBody) => {
  if (!xmlBody || typeof xmlBody !== "string") {
    const error = new Error("Invalid XML body");
    error.statusCode = 400;
    throw error;
  }

  const validation = XMLValidator.validate(xmlBody);

  if (validation !== true) {
    const error = new Error("Malformed XML body");
    error.statusCode = 400;
    throw error;
  }
};

const parseXml = (xmlBody) => {
  validateXmlBody(xmlBody);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    removeNSPrefix: true,
  });

  return parser.parse(xmlBody);
};

module.exports = {
  validateXmlBody,
  parseXml,
};
