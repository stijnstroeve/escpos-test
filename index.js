const {getDeviceList} = require('usb')
const util = require('util');

const findBySerialNumber = async (serialNumber) => {
    const devices = getDeviceList();
    const opened = (device) => !!device.interfaces;

    const regoVendor = 1155; // Vendor=0483 (hex)
    for (const device of devices) {
        try {
            const {idVendor}  = device.deviceDescriptor;
            if( idVendor !== regoVendor){
                continue; // not REGO
            }
            const {busNumber,deviceAddress}  = device;
            console.log('Found Rego', {busNumber,deviceAddress});
            try {
                if (!opened(device)) {
                    device.open();
                }
            } catch(e) {
                // Ignore any errors, device may be a system device or inaccessible
                console.error('device open, fail', e)
                continue;
            }

            const getStringDescriptor = util.promisify(device.getStringDescriptor).bind(device);
            let buffer = await getStringDescriptor(device.deviceDescriptor.iSerialNumber);

            if( buffer ){
                buffer = buffer.replace(/\0.*$/g,''); // Only change compared to the on from the library.
                if (buffer && buffer.toString() === serialNumber) {
                    return device;
                }
            }
        } finally {
            try {
                if (opened(device)) {
                    device.close();
                }
            } catch {
                // Ignore any errors, device may be a system device or inaccessible
            }
        }
    }

    return undefined;
};

(async () => {
    const usbDevice = await findBySerialNumber('0161811210210');
    console.log(usbDevice);
})()


