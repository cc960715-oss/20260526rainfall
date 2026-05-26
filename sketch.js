const stationCoords = {
  "湖田國小": { lat: 25.1528, lon: 121.5323, district: "北投區" },
  "大屯國小": { lat: 25.1741, lon: 121.4925, district: "北投區" },
  "桃源國中": { lat: 25.1397, lon: 121.4914, district: "北投區" },
  "北投國小": { lat: 25.1321, lon: 121.5005, district: "北投區" },
  "陽明高中": { lat: 25.0945, lon: 121.5148, district: "士林區" },
  "太平國小": { lat: 25.0610, lon: 121.5111, district: "大同區" },
  "民生國中": { lat: 25.0602, lon: 121.5606, district: "松山區" },
  "中正國中": { lat: 25.0336, lon: 121.5201, district: "中正區" },
  "三興國小": { lat: 25.0303, lon: 121.5583, district: "信義區" },
  "格致國中": { lat: 25.1362, lon: 121.5387, district: "士林區" },
  "平等國小": { lat: 25.1278, lon: 121.5714, district: "士林區" },
  "至善國中": { lat: 25.1014, lon: 121.5489, district: "士林區" },
  "碧湖國小": { lat: 25.0811, lon: 121.5878, district: "內湖區" },
  "東湖國小": { lat: 25.0689, lon: 121.6169, district: "內湖區" },
  "瑠公國中": { lat: 25.0372, lon: 121.5847, district: "信義區" },
  "舊莊國小": { lat: 25.0402, lon: 121.6186, district: "南港區" },
  "博嘉國小": { lat: 25.0000, lon: 121.5886, district: "文山區" },
  "北政國中": { lat: 24.9861, lon: 121.5786, district: "文山區" },
  "長安國小": { lat: 25.0489, lon: 121.5283, district: "中山區" },
  "萬華國中": { lat: 25.0278, lon: 121.4986, district: "萬華區" },
  "台灣大學(新)": { lat: 25.0175, lon: 121.5397, district: "大安區" },
  "雙園": { lat: 25.0232, lon: 121.4925, district: "萬華區" },
  "中洲": { lat: 25.1235, lon: 121.4608, district: "士林區" }
};

let myMap;
let canvas;
let stationData = {}; // 用於儲存從 API 獲取的即時資料
let isDataLoaded = false;
const mappa = new Mappa('Leaflet');

const options = {
  lat: 25.08,
  lng: 121.53,
  zoom: 11,
  style: "https://{s}.tile.osm.org/{z}/{x}/{y}.png"
};

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);

  // 使用公共 CORS 代理伺服器獲取資料
  // targetApi：台北市政府即時雨量資料
  const proxy = "https://api.allorigins.win/raw?url=";
  const targetApi = "https://wic.gov.taipei/OpenData/API/Rain/Get?stationNo=&loginId=open_rain&dataKey=85452C1D";
  
  loadJSON(proxy + encodeURIComponent(targetApi), (data) => {
    console.log("API 原始資料:", data); // 方便除錯
    if (Array.isArray(data)) {
      data.forEach(record => {
        // 進行模糊匹配：因為 API 站名可能是 "湖田"，而對照表是 "湖田國小"
        for (let key in stationCoords) {
          if (key.includes(record.stationName) || record.stationName.includes(key)) {
            stationData[key] = record;
          }
        }
      });
      isDataLoaded = true;
      console.log("匹配後的資料集:", stationData);
    } else {
      console.error("API 回傳格式不正確，預期為陣列。");
    }
  }, (err) => {
    console.error("無法取得資料:", err);
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  clear(); // 清除上一幀的畫布，保持地圖圖層可見

  let hoveredStation = null;

  for (let name in stationCoords) {
    const pos = myMap.latLngToPixel(stationCoords[name].lat, stationCoords[name].lon);
    
    // 根據雨量決定圓標大小 (直徑)
    let diameter = 12;
    if (isDataLoaded && stationData[name]) {
      let rainVal = parseFloat(stationData[name].rain) || 0;
      // 將雨量 0~50mm 映射到直徑 12~80px
      diameter = map(rainVal, 0, 50, 12, 80);
      diameter = constrain(diameter, 12, 100);
    }

    fill(255, 0, 0, 180); // 紅色帶透明度
    stroke(255); // 白色邊框
    strokeWeight(1);
    ellipse(pos.x, pos.y, diameter, diameter);

    // 偵測滑鼠是否懸停在圓標範圍內
    if (dist(mouseX, mouseY, pos.x, pos.y) < diameter / 2 + 2) {
      hoveredStation = name;
    }
  }

  if (hoveredStation) {
    fill(0);
    textSize(16);
    textAlign(LEFT, BOTTOM);
    
    let info = stationCoords[hoveredStation].district + " - " + hoveredStation;
    
    // 顯示即時雨量狀態
    if (!isDataLoaded) {
      info += "\n資料載入中...";
    } else if (stationData[hoveredStation]) {
      let rainVal = stationData[hoveredStation].rain;
      info += "\n目前雨量: " + (rainVal !== undefined ? rainVal : "無資料") + " mm";
    } else {
      info += "\n此測站目前無 API 數據";
    }
    
    text(info, mouseX + 15, mouseY - 10);
  }

  drawLegend();
}

function drawLegend() {
  push(); // 儲存目前的繪圖設定
  
  // 設定圖例位置與大小 (左上角)
  const x = 20;
  const y = 20;
  const w = 210;
  const h = 180;
  
  // 繪製圖例背景框 (白色半透明)
  fill(255, 255, 255, 220);
  stroke(180);
  strokeWeight(1);
  rect(x, y, w, h, 10);
  
  // 繪製標題
  noStroke();
  fill(50);
  textSize(16);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("臺北市降雨量圖例", x + 15, y + 15);
  
  // 繪製不同大小代表的降雨量級距
  textStyle(NORMAL);
  textSize(13);
  fill(100);
  text("圓標大小代表即時雨量 (mm)", x + 15, y + 45);

  fill(255, 0, 0, 180);
  stroke(255);
  ellipse(x + 30, y + 80, 12, 12);
  ellipse(x + 30, y + 115, 30, 30);
  ellipse(x + 30, y + 155, 45, 45);

  noStroke();
  fill(0);
  textAlign(LEFT, CENTER);
  text("無降雨 (0 mm)", x + 60, y + 80);
  text("小雨 (約 10 mm)", x + 60, y + 115);
  text("強降雨 (20+ mm)", x + 60, y + 155);
  
  pop(); // 恢復之前的繪圖設定
}
