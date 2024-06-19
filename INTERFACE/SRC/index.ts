import Chart from 'chart.js/auto';

const HISTORY = 10;
const HZ = 10;

const windowSize = 30;

let index = 0;

const windowData: number[][] = []; // Initialize with empty data

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

const bluetooth = {
	UUID: {
		service: '9ecadc24-0ee5-a9e0-93f3-a3b50100406e',
		characteristic: '9ecadc24-0ee5-a9e0-93f3-a3b50200406e',
	},
	device: null as BluetoothDevice | null,
	service: null as BluetoothRemoteGATTService | null,
	characteristic: null as BluetoothRemoteGATTCharacteristic | null,
	connect: async () => {
		await navigator.bluetooth.requestDevice({
			filters: [{ name: 'KINETI' }],
			optionalServices: [bluetooth.UUID.service]
		}).then(device => {
			if (!device) {
				throw new Error('No Bluetooth device selected.');
			}

			bluetooth.device = device;
	
			device.gatt!.connect().then(server => {
				server.getPrimaryService(bluetooth.UUID.service).then(service => {

					bluetooth.service = service;

					service.getCharacteristic(bluetooth.UUID.characteristic).then(characteristic => {

						bluetooth.characteristic = characteristic;

						characteristic.startNotifications().then(_ => {
							button.bluetooth.textContent = 'Disconnect';
							
							characteristic.addEventListener('characteristicvaluechanged', bluetooth.update);
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
	},
	update: (event: Event) => {
		if(!checkbox.data.checked) return;

		const target = event.target as BluetoothRemoteGATTCharacteristic; 
		const dataView = target.value!; // Non-null assertion (notification has value)
	
		// Process data (example assuming 20 bytes as per your previous code)
		let timestamp: number = dataView.getUint16(0, false) * 10;
	
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
	
		const newData: Data = {
			timestamp,
			magnetometer,
			accelerometer,
			gyroscope,
		};

		windowData.push([
			newData.accelerometer.x,
			newData.accelerometer.y,
			newData.accelerometer.z,
			newData.gyroscope.x,
			newData.gyroscope.y,
			newData.gyroscope.z,
		]);
		
		  // Keep the window data array at the correct size
		if (windowData.length > windowSize) {
			windowData.shift(); // Remove the oldest data point
		}

		// Display data
		dataDisplay.textContent = JSON.stringify(newData, null, 2);
		// Push Data
		data.push(newData);
		// UpdateGraph
		chart.update();

		if(index % 10 === 0 && windowData.length === windowSize && checkbox.prediction.checked) {

			fetch("http:" + "//" + document.location.hostname + ":5000/predict",{
				method: 'POST',
				headers: new Headers({ 'content-type': 'application/json' }),
				body: JSON.stringify(windowData),
			}).then(response => response.json()).then(data => {
				console.log()
				statusDisplay.textContent = data.predicted_label.toString();
			}).catch(err => console.error("FETCH ERROR: {}",err));
		}
	},
	disconnect: () => {
		bluetooth.characteristic?.stopNotifications().then(_ => {
			bluetooth.characteristic?.removeEventListener('characteristicvaluechanged', bluetooth.update);

			bluetooth.device!.gatt!.disconnect();
		}).catch(error => {
			console.error('Stop notifications error:', error);
		});

		bluetooth.device = null;
		bluetooth.service = null;
		bluetooth.characteristic = null;

		button.bluetooth.textContent = 'Connect';
	},
}

const canvas = {
	magnetometer: document.getElementById('magnetometer-graph')! as HTMLCanvasElement,
	accelerometer: document.getElementById('accelerometer-graph')! as HTMLCanvasElement,
	gyroscope: document.getElementById('gyroscope-graph')! as HTMLCanvasElement,
}

const button = {
	bluetooth: document.getElementById('bluetooth_button')! as HTMLButtonElement,
	clear: document.getElementById('clear_button')! as HTMLButtonElement,
	save: document.getElementById('save_button')! as HTMLButtonElement,
}

const checkbox = {
	data: document.getElementById('data_checkbox')! as HTMLInputElement,
	prediction: document.getElementById('prediction_checkbox')! as HTMLInputElement,
}

const chart = {
	magnetometer: new Chart(canvas.magnetometer, {
		type: "line",
		data: {
			datasets: [{
				label: "X",
				data: [],
				borderColor: "red",
				borderWidth: 1
			}, {
				label: "Y",
				data: [],
				borderColor: "green",
				borderWidth: 1
			}, {
				label: "Z",
				data: [],
				borderColor: "blue",
				borderWidth: 1
			}],
		},
		options: {
			animation: false,
			scales: {
				y: {
					beginAtZero: true,
				}
			}
		}
	}),
	accelerometer: new Chart(canvas.accelerometer, {
		type: "line",
		data: {
			datasets: [{
				label: "X",
				data: [],
				borderColor: "red",
				borderWidth: 1
			}, {
				label: "Y",
				data: [],
				borderColor: "green",
				borderWidth: 1
			}, {
				label: "Z",
				data: [],
				borderColor: "blue",
				borderWidth: 1
			}],
		},			
		options: {
			animation: false,
			scales: {
				y: {
					beginAtZero: true,
				}
			}
		}
	}),
	gyroscope:new Chart(canvas.gyroscope, {
		type: "line",
		data: {
			datasets: [{
				label: "X",
				data: [],
				borderColor: "red",
				borderWidth: 1
			}, {
				label: "Y",
				data: [],
				borderColor: "green",
				borderWidth: 1
			}, {
				label: "Z",
				data: [],
				borderColor: "blue",
				borderWidth: 1
			}],
		},
		options: {
			animation: false,
			scales: {
				y: {
					beginAtZero: true,
				}
			}
		}
	}),
	update: () => {
		if(data.length === 0) {
			chart.magnetometer.data.datasets.forEach(dataset => {
				dataset.data = [];
			});
			chart.accelerometer.data.datasets.forEach(dataset => {
				dataset.data = [];
			});
			chart.gyroscope.data.datasets.forEach(dataset => {
				dataset.data = [];
			});

			//hart.magnetometer.data.labels = [];
			//hart.accelerometer.data.labels = [];
			//hart.gyroscope.data.labels = [];
		} else {
			let newData = data[data.length - 1];

			index = index % (HISTORY * HZ);

			chart.magnetometer.data.labels![index] = newData.timestamp as never;
			chart.accelerometer.data.labels![index] = newData.timestamp as never;
			chart.gyroscope.data.labels![index] = newData.timestamp as never;


			chart.magnetometer.data.datasets[0].data[index] = newData.magnetometer.x as never;
			chart.magnetometer.data.datasets[1].data[index] = newData.magnetometer.y as never;
			chart.magnetometer.data.datasets[2].data[index] = newData.magnetometer.z as never;

			chart.accelerometer.data.datasets[0].data[index] = newData.accelerometer.x as never;
			chart.accelerometer.data.datasets[1].data[index] = newData.accelerometer.y as never;
			chart.accelerometer.data.datasets[2].data[index] = newData.accelerometer.z as never;

			chart.gyroscope.data.datasets[0].data[index] = newData.gyroscope.x as never;
			chart.gyroscope.data.datasets[1].data[index] = newData.gyroscope.y as never;
			chart.gyroscope.data.datasets[2].data[index] = newData.gyroscope.z as never;
		}

		chart.magnetometer.update();
		chart.accelerometer.update();
		chart.gyroscope.update();

		index++;
	}
}

const dataDisplay = document.getElementById('data_display')!;
const statusDisplay = document.getElementById('status_display')!;

let data: Data[] = [];

button.bluetooth.addEventListener('click', ()=> {
	if(!bluetooth.device) {
		bluetooth.connect();
	} else {
		bluetooth.disconnect();
	}
});
button.clear.addEventListener('click', ()=> {
	data = [];

	chart.update();
  
	dataDisplay.textContent = '';
});
button.save.addEventListener('click', ()=> {
	// Create the CSV header
	const csvHeader = "timestamp,magnetometer/x,magnetometer/y,magnetometer/z,accelerometer/x,accelerometer/y,accelerometer/z,gyroscope/x,gyroscope/y,gyroscope/z\n";

	// Convert the data array to CSV format
	const csvRows = data.map(row => {
		return `${row.timestamp},${row.magnetometer.x},${row.magnetometer.y},${row.magnetometer.z},${row.accelerometer.x},${row.accelerometer.y},${row.accelerometer.z},${row.gyroscope.x},${row.gyroscope.y},${row.gyroscope.z}`; 
	}).join('\n'); // Join rows with newlines

	// Combine header and data
	const csvContent = csvHeader + csvRows;

	// Create a Blob (binary data) from the CSV string
	const blob = new Blob([csvContent], { type: 'text/csv' });
	const url = URL.createObjectURL(blob);

	// Create a temporary link element to trigger the download
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', 'workout_data.csv'); // Set filename
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link); // Clean up
});