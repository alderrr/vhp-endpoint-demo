const checkReqType = (xmlBody) => {
  // Checking Flag in XML
  //! IDeaS
  const flag_ideas_1 = xmlBody.includes(
    "HTNG_ARIAndReservationPushService#OTA_HotelRatePlanNotifRQ"
  );
  const flag_ideas_2 = xmlBody.includes(
    "HTNG_ARIAndReservationPush#OTA_HotelResNotifRQ"
  );
  //TODO Add other...

  // Response Type for File Name
  //! IDeaS
  if (flag_ideas_1) {
    return "RateRQ";
  }
  if (flag_ideas_2) {
    return "NotifRQ";
  }
  //TODO Add other...

  //! Default
  return "Request_Body";
};

module.exports = checkReqType;
