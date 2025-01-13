const checkReqType = (xmlBody) => {
  // Checking Flag in XML
  //! IDeaS
  const flag_ideas1 = xmlBody.includes(
    "HTNG_ARIAndReservationPushService#OTA_HotelRatePlanNotifRQ"
  );
  const flag_ideas2 = xmlBody.includes(
    "HTNG_ARIAndReservationPush#OTA_HotelResNotifRQ"
  );
  //TODO Add other...

  // Response Type for File Name
  //! IDeaS
  if (flag_ideas1) {
    return "RateRQ";
  }
  if (flag_ideas2) {
    return "NotifRQ";
  }
  //TODO Add other...

  //! Default
  return "Response";
};

module.exports = checkReqType;
