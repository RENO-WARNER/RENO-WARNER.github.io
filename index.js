"use strict";
const serviceUuid = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const characteristicUuid = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
let bluetoothDevice = null;
let characteristic = null;
const dataDisplay = document.getElementById('data_display'); // Non-null assertion 
const connectButton = document.getElementById('connect_button'); // Non-null assertion
connectButton.addEventListener('click', connect);
async function connect() {
    await navigator.bluetooth.requestDevice({
        filters: [{ name: 'KINETI' }],
        //optionalServices: [serviceUuid]
    }).then(device => {
        if (!device) {
            throw new Error('No Bluetooth device selected.');
        }
        device.gatt.connect().then(server => {
            server.getPrimaryService(serviceUuid).then(service => {
                service.getCharacteristic(characteristicUuid).then(characteristic => {
                    characteristic.startNotifications().then(_ => {
                        characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
                    }).catch(error => {
                        console.error('Start notifications error:', error);
                    });
                    console.log('Bluetooth connected and notifications subscribed!');
                }).catch(error => {
                    console.error('Characteristic error:', error);
                });
            }).catch(error => {
                console.error('Service error:', error);
            });
        }).catch(error => {
            console.error('Gatt error:', error);
        }); // Non-null assertion (connected)
    }).catch(error => {
        console.error('Bluetooth error:', error);
    });
}
function handleCharacteristicValueChanged(event) {
    console.log('Characteristic value changed:', event);
    const target = event.target;
    const dataView = target.value; // Non-null assertion (notification has value)
    // Process data (example assuming 20 bytes as per your previous code)
    let timestamp = dataView.getUint16(0, false);
    let magnetometer = {
        x: dataView.getInt16(2, false),
        y: dataView.getInt16(4, false),
        z: dataView.getInt16(6, false),
    };
    let gyroscope = {
        x: dataView.getInt16(8, false),
        y: dataView.getInt16(10, false),
        z: dataView.getInt16(12, false),
    };
    let accelerometer = {
        x: dataView.getInt16(14, false),
        y: dataView.getInt16(16, false),
        z: dataView.getInt16(18, false),
    };
    const data = {
        timestamp,
        magnetometer,
        accelerometer,
        gyroscope,
    };
    // Display data
    dataDisplay.textContent = JSON.stringify(data, null, 2);
}
