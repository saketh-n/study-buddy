#!/bin/bash

# Study Buddy Development Script
# Usage: ./dev.sh                # normal mode (both in background)
#        ./dev.sh --separate     # backend in new tab, frontend in current

SEPARATE_TABS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --separate|--tabs)
            SEPARATE_TABS=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--separate|--tabs]"
            exit 1
            ;;
    esac
done

echo "Starting Study Buddy development servers..."
echo ""

# [Your existing venv / node_modules checks remain unchanged]
# ... keep all your existing checks here ...

echo ""
echo "Starting backend server on http://localhost:8000"
echo "Starting frontend server on http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to start backend in a new terminal tab/window
open_backend_tab() {
    # macOS Terminal.app
    if [[ "$OSTYPE" == "darwin"* ]] && command -v osascript >/dev/null; then
        osascript <<EOF
tell application "Terminal"
    do script "cd $(pwd)/backend && source venv/bin/activate && uvicorn main:app --reload"
    activate
end tell
EOF
    # GNOME Terminal (most Linux distros)
    elif command -v gnome-terminal >/dev/null; then
        gnome-terminal -- bash -c "cd $(pwd)/backend && source venv/bin/activate && exec uvicorn main:app --reload; exec bash"
    # KDE Konsole
    elif command -v konsole >/dev/null; then
        konsole --new-tab -e bash -c "cd $(pwd)/backend && source venv/bin/activate && uvicorn main:app --reload; exec bash"
    # Alacritty (with --hold if you want it to stay open on error)
    elif command -v alacritty >/dev/null; then
        alacritty -e bash -c "cd $(pwd)/backend && source venv/bin/activate && uvicorn main:app --reload; read"
    # Fallback: just run in background like before
    else
        echo "No supported terminal found for opening new tab, falling back to background mode"
        cd backend && source venv/bin/activate && uvicorn main:app --reload &
        echo $!  # return PID
    fi
}

if [ "$SEPARATE_TABS" = true ]; then
    echo "Opening backend in a new terminal tab..."
    open_backend_tab
    sleep 2  # give it a moment to start
else
    cd backend
    source venv/bin/activate
    uvicorn main:app --reload &
    BACKEND_PID=$!
    cd ..
fi

# Start frontend (always in current terminal when using --separate)
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping servers..."
    if [ "$SEPARATE_TABS" = false ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped"
    exit 0
}

trap cleanup INT

# Keep script alive
wait