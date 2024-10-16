# test_api.py

import requests

def test_ping():
    print('Testing /ping endpoint...')
    response = requests.get('http://localhost:58652/ping')
    print('Response:', response.json())

def test_list_audio_devices():
    print('Testing /list_audio_devices endpoint...')
    response = requests.get('http://localhost:58652/list_audio_devices')
    devices = response.json().get('devices', [])
    for device in devices:
        print(f"Device index: {device['index']}, Name: {device['name']}, Current: {'Yes' if device['is_current'] else 'No'}")

def test_set_audio_device(index):
    print(f'Testing /set_audio_device endpoint, setting device index to {index}...')
    payload = {'index': index}
    response = requests.post('http://localhost:58652/set_audio_device', json=payload)
    print('Response:', response.json())
    
    if response.json()['status'] == 'success':
        print(f"Set successfully. Current device: Index {response.json()['device']['index']}, Name {response.json()['device']['name']}")
    else:
        print(f"Set failed. Error message: {response.json()['message']}")
        print(f"Current device: Index {response.json()['device']['index']}, Name {response.json()['device']['name']}")

def test_set_hotkey(hotkey):
    print(f'Testing /set_hotkey endpoint, setting hotkey to "{hotkey}"...')
    payload = {'hotkey': hotkey}
    response = requests.post('http://localhost:58652/set_hotkey', json=payload)
    print('Response:', response.json())
    
    if response.json()['status'] == 'success':
        print(f"Set successfully. Current hotkey: {response.json()['hotkey']}")
    else:
        print(f"Set failed. Error message: {response.json()['message']}")
        print(f"Current hotkey: {response.json()['hotkey']}")

def test_get_hotkey():
    print('Testing /get_hotkey endpoint...')
    response = requests.get('http://localhost:58652/get_hotkey')
    print('Response:', response.json())

def test_error_cases():
    print("\nTesting error cases:")
    
    # Test setting invalid audio device index
    print("\nTesting setting invalid audio device index:")
    test_set_audio_device(-1)
    test_set_audio_device(9999)
    
    # Test setting invalid hotkey
    print("\nTesting setting invalid hotkey:")
    test_set_hotkey("")
    test_set_hotkey("invalid_hotkey")
    test_set_hotkey("ctrl+")  # Incomplete hotkey
    test_set_hotkey("ctrl+invalid")  # Invalid key name
    
    # Test sending invalid JSON to set_audio_device
    print("\nTesting sending invalid JSON to set_audio_device:")
    response = requests.post('http://localhost:58652/set_audio_device', json={"invalid_key": 0})
    print('Response:', response.json())
    
    # Test sending invalid JSON to set_hotkey
    print("\nTesting sending invalid JSON to set_hotkey:")
    response = requests.post('http://localhost:58652/set_hotkey', json={"invalid_key": "ctrl+q"})
    print('Response:', response.json())

if __name__ == '__main__':
    test_ping()
    print()
    test_list_audio_devices()
    print()
    # Replace the index below with an actual existing audio device index
    test_set_audio_device(1)
    print()
    test_set_hotkey('ctrl+a')
    print()
    test_get_hotkey()
    print()
    test_error_cases()
