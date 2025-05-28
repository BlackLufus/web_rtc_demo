# WebRTC Demo mit Chat (Proof of Concept)

Dieses Projekt ist eine einfache WebRTC-Demo mit integriertem Chat. Die initiale Signalisierung erfolgt über eine WebSocket-Verbindung, anschließend wird eine direkte RTC-Verbindung zwischen den Clients aufgebaut.

## Voraussetzungen

- Node.js ist installiert

## Projekt aufsetzen

```bash
# npm initialisieren
npm init -y

# TypeScript lokal installieren
npm install typescript --save-dev

# TypeScript-Konfiguration erstellen
npx tsc --init
```

## TypeScript kompilieren

Vor dem Starten muss die TypeScript-Datei kompiliert werden:

```bash
npx tsc
```

## Server starten

Der Server dient sowohl zur Auslieferung der HTML/JS-Dateien (per HTTP), als auch zur WebSocket-Kommunikation zur Signalisierung:

```bash
node server.js
```

## Ablauf

1. Die Clients verbinden sich per WebSocket mit dem Server und tauschen Signalisierungsdaten aus (z. B. SDP, ICE).

2. Nach erfolgreicher Aushandlung wird eine WebRTC-Verbindung aufgebaut.

3. Die Kommunikation läuft anschließend nur direkt über die Peer-to-Peer-Verbindung (RTC), inklusive Chatfunktion.