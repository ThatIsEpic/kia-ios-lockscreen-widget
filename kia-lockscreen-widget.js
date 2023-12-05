// This script was downloaded using ScriptDude.
// Do not remove these lines, if you want to benefit from automatic updates.
// source: https://gist.githubusercontent.com/ThatIsEpic/a1965e1c65aa7dfc8a819d51826d4b7b/raw/17783d57d7848515dcb4f7035ff6922dfb56e280/kia-lockscreen-widget.js; docs: https://github.com/ThatIsEpic/kia-ios-lockscreen-widget/blob/main/README.md;

// icon-color: green; icon-glyph: battery-half;

/**
 * This widget has been developed by Niklas Vieth and customised by Sebbo.
 * Installation and configuration details can be found at https://github.com/ThatIsEpic/kia-ios-lockscreen-widget
 */

// Tibber config
const TIBBER_EMAIL = "<EMAIL_ADDRESS>";
const TIBBER_PASSWORD = "<PASSWORD>";
const TIBBER_BASE_URL = "https://app.tibber.com";

// Icons
const KIA_ICON = "https://www.kia.com/etc.clientlibs/settings/wcm/designs/kiapress/clientlibs/resources/rbr/logos/logo_kia_white-rbr.png";
const KIA_ICON_SIZE = new Size(25, 13);
const CHARGING_ICON = "https://support.apple.com/library/content/dam/edam/applecare/images/en_US/iOS/ios15-battery-charging-status-icon.png";
const CHARGING_ICON_SIZE = new Size(30, 16);

// Circle constants
const CANVAS_SIZE = 200;
const CANVAS_WIDTH = 18; // circle thickness
const CANVAS_RADIUS = 80; // circle radius

// Check that parameters are set
if (TIBBER_EMAIL === "<EMAIL_ADDRESS>") {
  throw new Error("Parameter TIBBER_EMAIL is not configured");
}
if (TIBBER_PASSWORD === "<PASSWORD>") {
  throw new Error("Parameter TIBBER_PASSWORD is not configured");
}

// Create widget
try {
  // Create widget
  const tibberData = await fetchTibberData();
  if (!tibberData || !tibberData.battery) {
    handleError("Failed to fetch Tibber data or battery information");
  }

  const batteryPercent = tibberData.battery.percent;
  const isCharging = tibberData.battery.isCharging;

  const widget = new ListWidget();
  widget.url = "mkiaconnecteu://";
  const progressStack = await drawArc(widget, batteryPercent);

  const batteryInfoStack = progressStack.addStack();
  batteryInfoStack.layoutVertically();

  // Create icons
  const chargingIcon = await loadImageWithHandling(CHARGING_ICON, "charging");
  const brandIcon = await loadImageWithHandling(KIA_ICON, "brand");

  const imageStack = batteryInfoStack.addStack();
  imageStack.addSpacer();

  var icon;
  if (isCharging) {
    icon = imageStack.addImage(chargingIcon);
    icon.imageSize = CHARGING_ICON_SIZE;
    imageStack.setPadding(0, 10, 0, 0);
  } else {
    icon = imageStack.addImage(brandIcon);
    icon.imageSize = KIA_ICON_SIZE;
  }
  icon.cornerRadius = 4;

  imageStack.addSpacer();

  // Percent text
  batteryInfoStack.addSpacer(2);
  const textStack = batteryInfoStack.addStack();
  textStack.centerAlignContent();
  textStack.addSpacer();
  textStack.addText(`${batteryPercent}%`);
  textStack.addSpacer();

  widget.presentAccessoryCircular();
  Script.setWidget(widget);
  Script.complete();
} catch (error) {
  handleError("Error fetching data", error);
}

// Error handler
function handleError(errorMessage, errorDetails) {
  console.error("Error:", errorDetails);
  // Handle the error gracefully, perhaps show an error message on the widget
  const errorWidget = new ListWidget();
  errorWidget.addText(errorMessage);
  Script.setWidget(errorWidget);
  Script.complete();
}

/********************
 * Tibber API helpers
 ********************/

// Tibber token
async function fetchTibberToken() {
  const tokenUrl = `${TIBBER_BASE_URL}/login.credentials`;
  const body = {
    "@type": "login",
    email: TIBBER_EMAIL,
    password: TIBBER_PASSWORD,
  };
  const req = new Request(tokenUrl);
  req.method = "POST";
  req.body = JSON.stringify(body);
  req.headers = {
    "Content-Type": "application/json",
    charset: "utf-8",
  };
  const response = await req.loadJSON();
  return response.token;
}

// Tibber data
async function fetchTibberData() {
  const tibberToken = await fetchTibberToken();
  const url = `${TIBBER_BASE_URL}/v4/gql`;
  const body = {
    query: "{me{homes{electricVehicles{battery{percent isCharging}}}}}",
  };
  const req = new Request(url);
  req.method = "POST";
  req.body = JSON.stringify(body);
  req.headers = {
    "Content-Type": "application/json",
    charset: "utf-8",
    Authorization: `Bearer ${tibberToken}`,
  };
  const response = await req.loadJSON();
  return response.data.me.homes[0].electricVehicles[0];
}

// Load images
async function loadImageWithHandling(url, altText) {
  try {
    const req = new Request(url);
    return await req.loadImage();
  } catch (error) {
    console.error(`Error loading ${altText} icon from ${url}:`, error);
    throw new Error(`Failed to load ${altText} icon`);
  }
}


/*****************************
 * Draw battery percent circle
 * Forked and adapted from https://gist.githubusercontent.com/Sillium/4210779bc2d759b494fa60ba4f464bd8/raw/9e172bac0513cc3cf0e70f3399e49d10f5d0589c/ProgressCircleService.js
 *****************************/

async function drawArc(on, batteryPercent) {
  const canvas = new DrawContext();
  canvas.opaque = false;
  canvas.size = new Size(CANVAS_SIZE, CANVAS_SIZE);
  canvas.respectScreenScale = true;

  const deg = Math.floor(batteryPercent * 3.6);

  let ctr = new Point(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  const bgx = ctr.x - CANVAS_RADIUS;
  const bgy = ctr.y - CANVAS_RADIUS;
  const bgd = 2 * CANVAS_RADIUS;
  const bgr = new Rect(bgx, bgy, bgd, bgd);

  canvas.opaque = false;

  canvas.setFillColor(Color.white());
  canvas.setStrokeColor(new Color("#333333"));
  canvas.setLineWidth(CANVAS_WIDTH);
  canvas.strokeEllipse(bgr);

  for (let t = 0; t < deg; t++) {
    const rect_x = ctr.x + CANVAS_RADIUS * sinDeg(t) - CANVAS_WIDTH / 2;
    const rect_y = ctr.y - CANVAS_RADIUS * cosDeg(t) - CANVAS_WIDTH / 2;
    const rect_r = new Rect(rect_x, rect_y, CANVAS_WIDTH, CANVAS_WIDTH);
    canvas.fillEllipse(rect_r);
  }

  let stack = on.addStack();
  stack.size = new Size(65, 65);
  stack.backgroundImage = canvas.getImage();
  let padding = 0;
  stack.setPadding(padding, padding, padding, padding);
  stack.centerAlignContent();

  return stack;
}

function sinDeg(deg) {
  try {
    return Math.sin((deg * Math.PI) / 180);
  } catch (error) {
    console.error("Error in sinDeg function:", error);
    throw new Error("Failed to calculate sine value");
  }
}

function cosDeg(deg) {
  try {
    return Math.cos((deg * Math.PI) / 180);
  } catch (error) {
    console.error("Error in cosDeg function:", error);
    throw new Error("Failed to calculate cosine value");
  }
}