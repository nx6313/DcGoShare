<template>
  <div class="journeyShareContainer">
    <div id="container"/>
    <div class="goInfo">
      <div class="goItem">
        <span class="goTitle">里程（千米）</span>
        <span class="goData"><span class="bigTxt">{{distanceInteger}}</span>.{{distanceDecimals}}</span>
      </div>
      <div class="goItem">
        <span class="goTitle">时间（分钟）</span>
        <span class="goData"><span class="bigTxt">{{timeInteger}}</span>.{{timeDecimals}}</span>
      </div>
      <div class="goItem">
        <span class="goTitle">费用（元）</span>
        <span class="goData"><span class="bigTxt">{{amountInteger}}</span>.{{amountDecimals}}</span>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
export default {
  name: 'JourneyShare',
  data() {
    return {
      // 订单状态
      orderStatus: {
        ORDER_STATE_ORDER_CREATE: 1, // 订单创建
        ORDER_STATE_DRIVER_RECEIVE: 2, // 司机接单
        ORDER_STATE_ORDER_START: 3, // 订单开始
        ORDER_STATE_DESTINATION: 4, // 到达终点
        ORDER_STATE_ORDER_PAY: 5, // 订单已支付
        ORDER_STATE_ORDER_CANCEL: 6, // 订单取消
        ORDER_STATE_DRIVER_TO_END_PASSENGER: 7, // 司机到达接乘客目的地
        ORDER_STATE_DRIVER_UPDATE_END: 8, // 司机修改终点
      },
      map: null,
      driverMarker: null,
      lastDriverLocations: null,
      travelLine: [], // 司机行驶轨迹点数组
      getDriverLocationInterval: 6000,
      distanceInteger: '-',
      distanceDecimals: '--',
      timeInteger: '-',
      timeDecimals: '--',
      amountInteger: '-',
      amountDecimals: '--'
    }
  },
  mounted() {
    this.map = new AMap.Map('container', {
      center: [112.553846, 37.782199],
      zoom: 16
    })
    var trafficLayer = new AMap.TileLayer.Traffic({
        zIndex: 10
    })
    this.map.add(trafficLayer)
  },
  created() {
    // 先检查当前订单状态
    this.$comfun.http_post(this, `api/member/getOrder`).then(response => {
      if (!response.data.data) {
        // 没有未完成订单
        alert('无行驶中订单')
        return
      }
      var status = response.data.data.status
      var orderId = response.data.data.orderId
      var driverId = response.data.data.driverId
      var amount = response.data.data.amount
      var realPay = response.data.data.realPay
      var car = response.data.data.car
      var destination = response.data.data.destination
      var reservationAddress = response.data.data.reservationAddress
      var driverOrderCount = response.data.data.driverOrderCount
      var nickName = response.data.data.nickName
      var phone = response.data.data.phone
      var praise = response.data.data.praise
      var trip = response.data.data.trip // endLatitude、endLongitude、endTime、member、orderId、startLatitude、startLongitude、startTime
      var waitTime = response.data.data.waitTime
      if (status == this.orderStatus.ORDER_STATE_ORDER_CREATE || status == this.orderStatus.ORDER_STATE_ORDER_CANCEL || status == this.orderStatus.ORDER_STATE_ORDER_PAY) {
        // 无行驶中订单
        alert('无行驶中订单')
      } else if (status == this.orderStatus.ORDER_STATE_DESTINATION) {
        // 司机到达终点，需要支付
        alert('司机已到达终点，需要支付')
      } else if (status == this.orderStatus.ORDER_STATE_DRIVER_RECEIVE) {
        // 司机已接单，正在前往接乘客
        this.getDriverLocation(new AMap.LngLat(trip.startLongitude, trip.startLatitude), new AMap.LngLat(trip.endLongitude, trip.endLatitude), driverId, orderId)
      } else if (status == this.orderStatus.ORDER_STATE_DRIVER_TO_END_PASSENGER) {
        // 司机已到达乘客起点
        alert('司机已到达行程起点，请您拿好行李上车')
        this.getDriverLocation(new AMap.LngLat(trip.startLongitude, trip.startLatitude), new AMap.LngLat(trip.endLongitude, trip.endLatitude), driverId, orderId)
      } else if (status == this.orderStatus.ORDER_STATE_ORDER_START) {
        // 司机开始行程前往目的地
        this.getDriverLocation(new AMap.LngLat(trip.startLongitude, trip.startLatitude), new AMap.LngLat(trip.endLongitude, trip.endLatitude), driverId, orderId)
      }
    }, () => {
      alert('获取订单数据失败，请刷新页面重试')
    })
  },
  methods: {
    getDriverLocation(startLatLng, endLatLng, driverId, orderId) {
      // 添加起点和终点标记
      var startMarker = new AMap.Marker({
        icon: new AMap.Icon({
          size: new AMap.Size(50, 50),
          image: require('../assets/start_point.png'),
          imageSize: new AMap.Size(50, 50)
        }),
        position: [startLatLng.lng, startLatLng.lat],
        offset: new AMap.Pixel(0, -50)
      })
      startMarker.setMap(this.map)
      var endMarker = new AMap.Marker({
        icon: new AMap.Icon({
          size: new AMap.Size(50, 50),
          image: require('../assets/end_point.png'),
          imageSize: new AMap.Size(50, 50)
        }),
        position: [endLatLng.lng, endLatLng.lat],
        offset: new AMap.Pixel(0, -50)
      })
      endMarker.setMap(this.map)
      this.map.setFitView()
      this.requestDriverLocation(driverId, orderId)
      setInterval(() => {
        this.map.setFitView()
        this.requestDriverLocation(driverId, orderId)
      }, this.getDriverLocationInterval)
    },
    requestDriverLocation(driverId, orderId) {
        this.$comfun.http_post(this, `api/member/getDriverLocation`, {
          driverId: driverId,
          orderId: orderId
        }).then(response => {
          console.log(response)
          if (!response.data.data) {
            return
          }
          var driverRealLocation = response.data.data.driverRealLocation // accuracy、driver、id、latitude、longitude、orientation、recive_time、speed、type
          var calculationDto = response.data.data.calculationDto
          var interval = response.data.data.interval
          if (calculationDto != null) {
            this.distanceInteger = String(calculationDto.distance.toFixed(2)).split('.')[0]
            this.distanceDecimals = String(calculationDto.distance.toFixed(2)).split('.')[1]
            if (interval != null) {
              this.timeInteger = String((interval / 60).toFixed(2)).split('.')[0]
              this.timeDecimals = String((interval / 60).toFixed(2)).split('.')[1]
            }
            this.amountInteger = String(calculationDto.totalAmount.toFixed(2)).split('.')[0]
            this.amountDecimals = String(calculationDto.totalAmount.toFixed(2)).split('.')[1]
          }
          this.showDriverLocation(new AMap.LngLat(driverRealLocation.longitude, driverRealLocation.latitude), driverRealLocation.orientation)
        })
    },
    showDriverLocation(driverLatLng, orientation) {
      // 添加司机Marker
      if (this.driverMarker === null) {
        this.driverMarker = new AMap.Marker({
          icon: new AMap.Icon({
            size: new AMap.Size(41, 22),
            image: require('../assets/default_driver_car.png'),
            imageSize: new AMap.Size(41, 22)
          }),
          position: [driverLatLng.lng, driverLatLng.lat],
          offset: new AMap.Pixel(-20, -11),
          autoRotation: true,
          angle: orientation
        })
        this.driverMarker.setMap(this.map)
      }
      this.travelLine = []
      var speed = 100
      if (this.lastDriverLocation != null) {
        this.travelLine.push(this.lastDriverLocation)
        var distance = new AMap.LngLat(this.lastDriverLocation[0], this.lastDriverLocation[1]).distance(new AMap.LngLat(driverLatLng.lng, driverLatLng.lat))
        speed = distance / ((this.getDriverLocationInterval + 100) / 1000) * 3.6 // 千米/小时
        if (speed === 0) {
          speed = 100
        }
      }
      this.travelLine.push([driverLatLng.lng, driverLatLng.lat])
      this.lastDriverLocation = [driverLatLng.lng, driverLatLng.lat]
      if (this.travelLine.length > 1) {
        this.moveAlongDriver(speed)
      }
    },
    moveAlongDriver(speed) {
      // 绘制轨迹
      var polyline = new AMap.Polyline({
        map: this.map,
        path: this.travelLine,
        showDir: true,
        strokeColor: "#28F", // 线颜色
        strokeOpacity: 0, //线透明度
        strokeWeight: 6, //线宽
        // strokeStyle: "solid" //线样式
      })
      var passedPolyline = new AMap.Polyline({
        map: this.map,
        // path: this.travelLine,
        strokeColor: "#AF5", //线颜色
        strokeOpacity: 0, //线透明度
        strokeWeight: 6, //线宽
        // strokeStyle: "solid" //线样式
      })
      this.driverMarker.on('moving', (data) => {
        passedPolyline.setPath(data.passedPath)
      })
      this.driverMarker.moveAlong(this.travelLine, speed)
      this.map.setFitView()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>
.journeyShareContainer {
  width: 100vw;
  height: 100vh;
}

#container {
  position: absolute;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
}

.goInfo {
  position: absolute;
  background: #ffffff;
  width: calc(94vw - 16px);
  left: 3vw;
  top: 10px;
  box-shadow: 1px 2px 4px 0px #00000040;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 3px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  .goItem {
    .goTitle {
      display: block;
      text-align: stretch;
      font-size: 0.9rem;
      color: rgb(65, 65, 65);
    }
    .goData {
      display: block;
      text-align: center;
      margin-top: 4px;
      font-size: 0.86rem;
      color: rgb(41, 119, 221);
      .bigTxt {
        font-size: 1.2rem;
      }
    }
  }
}
</style>
