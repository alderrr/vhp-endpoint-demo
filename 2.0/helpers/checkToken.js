const { DOMParser } = require("@xmldom/xmldom");

const checkMessageToken = (xmlBody) => {
  const xmlparser = new DOMParser();
  const xmlparsed = xmlparser.parseFromString(xmlBody, "text/xml");
  const namesplaceURI = "http://protel.io/soap";
  const messageTokenElement = xmlparsed.getElementsByTagNameNS(
    namesplaceURI,
    "Token"
  )[0];
  const messageToken = messageTokenElement
    ? messageTokenElement.textContent.trim()
    : null;
  return messageToken;
};

module.exports = checkMessageToken;
