interface Vector {
	x: number;
	y: number;
	z: number;
}

interface Data {
	timestamp: number;

	magnetometer: Vector,
	accelerometer: Vector,
	gyroscope: Vector,
}

const serviceUuid = '9ecadc24-0ee5-a9e0-93f3-a3b50100406e'; 
const characteristicUuid = '9ecadc24-0ee5-a9e0-93f3-a3b50200406e'; 

let bluetoothDevice: BluetoothDevice | null = null;
let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

const dataDisplay = document.getElementById('data_display')!; // Non-null assertion 
const connectButton = document.getElementById('connect_button')!; // Non-null assertion

connectButton.addEventListener('click', connect);

async function connect() {
    await navigator.bluetooth.requestDevice({
        filters: [{ name: 'KINETI' }],
        optionalServices: [serviceUuid]
    }).then(device => {
		if (!device) {
			throw new Error('No Bluetooth device selected.');
		}

		device.gatt!.connect().then(server => {
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

function handleCharacteristicValueChanged(event: Event) {
	console.log('Characteristic value changed:', event);

	const target = event.target as BluetoothRemoteGATTCharacteristic; 
	const dataView = target.value!; // Non-null assertion (notification has value)

	// Process data (example assuming 20 bytes as per your previous code)
	let timestamp: number = dataView.getUint16(0, false);

	let magnetometer: Vector = {
		x: dataView.getInt16(2, false),
		y: dataView.getInt16(4, false),
		z: dataView.getInt16(6, false),
	};

	let gyroscope: Vector = {
		x: dataView.getInt16(8, false),
		y: dataView.getInt16(10, false),
		z: dataView.getInt16(12, false),
	};

	let accelerometer: Vector = {
		x: dataView.getInt16(14, false),
		y: dataView.getInt16(16, false),
		z: dataView.getInt16(18, false),
	};

	const data: Data = {
		timestamp,
		magnetometer,
		accelerometer,
		gyroscope,
	};

	// Display data
	dataDisplay.textContent = JSON.stringify(data, null, 2);
}

