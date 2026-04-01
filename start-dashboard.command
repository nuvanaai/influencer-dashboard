#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Starting Cata's Command Center..."
echo "Opening in your browser at http://localhost:3333"
open http://localhost:3333
node server.js
