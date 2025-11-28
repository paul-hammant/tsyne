package main

import (
	"bufio"
	"encoding/binary"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"path/filepath"
	"sync"

	"github.com/apache/fury/go/fury"
)

// ForyServer handles Apache Fory over Unix Domain Socket communication
type ForyServer struct {
	bridge     *Bridge
	socketPath string
	listener   net.Listener
	clients    sync.Map // map of client connections
	eventChan  chan Event
	mu         sync.Mutex
	fury       *fury.Fury
}

// ForyMessage represents a message in Fory format
type ForyMessage struct {
	ID      string                 `fury:"id"`
	Type    string                 `fury:"type"`
	Payload map[string]interface{} `fury:"payload"`
}

// ForyResponse represents a response in Fory format
type ForyResponse struct {
	ID      string                 `fury:"id"`
	Success bool                   `fury:"success"`
	Result  map[string]interface{} `fury:"result,omitempty"`
	Error   string                 `fury:"error,omitempty"`
}

// ForyEvent represents an event in Fory format
type ForyEvent struct {
	Type     string                 `fury:"type"`
	WidgetID string                 `fury:"widgetId"`
	Data     map[string]interface{} `fury:"data,omitempty"`
}

// NewForyServer creates a new Apache Fory UDS server
func NewForyServer(bridge *Bridge) *ForyServer {
	// Create socket in temp directory
	socketPath := filepath.Join(os.TempDir(), fmt.Sprintf("tsyne-fory-%d.sock", os.Getpid()))

	// Initialize Fury instance with default options
	f := fury.NewFury(true)

	// Register types for serialization
	f.RegisterTagType("Message", ForyMessage{})
	f.RegisterTagType("Response", ForyResponse{})
	f.RegisterTagType("Event", ForyEvent{})

	return &ForyServer{
		bridge:     bridge,
		socketPath: socketPath,
		eventChan:  make(chan Event, 256),
		fury:       f,
	}
}

// Start starts the Fory UDS server
func (s *ForyServer) Start() error {
	// Remove existing socket file if present
	os.Remove(s.socketPath)

	var err error
	s.listener, err = net.Listen("unix", s.socketPath)
	if err != nil {
		return fmt.Errorf("failed to listen on unix socket: %w", err)
	}

	// Start accepting connections in background
	go s.acceptConnections()

	// Start event broadcaster
	go s.broadcastEvents()

	return nil
}

// GetSocketPath returns the socket path for clients to connect
func (s *ForyServer) GetSocketPath() string {
	return s.socketPath
}

// Close closes the server and cleans up
func (s *ForyServer) Close() {
	if s.listener != nil {
		s.listener.Close()
	}
	os.Remove(s.socketPath)
	close(s.eventChan)
}

// SendEvent sends an event to all connected clients
func (s *ForyServer) SendEvent(event Event) {
	select {
	case s.eventChan <- event:
	default:
		// Channel full, drop event (shouldn't happen with large buffer)
	}
}

func (s *ForyServer) acceptConnections() {
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			// Listener closed
			return
		}

		// Handle each client in a goroutine
		go s.handleClient(conn)
	}
}

func (s *ForyServer) handleClient(conn net.Conn) {
	defer conn.Close()

	// Register client for events
	clientID := fmt.Sprintf("%p", conn)
	s.clients.Store(clientID, conn)
	defer s.clients.Delete(clientID)

	reader := bufio.NewReader(conn)

	for {
		// Read length prefix (4 bytes, big-endian)
		lengthBuf := make([]byte, 4)
		_, err := io.ReadFull(reader, lengthBuf)
		if err != nil {
			if err != io.EOF {
				log.Printf("[fory] Error reading length: %v", err)
			}
			return
		}

		length := binary.BigEndian.Uint32(lengthBuf)
		if length > 100*1024*1024 { // 100MB max
			log.Printf("[fory] Message too large: %d bytes", length)
			return
		}

		// Read message body
		msgBuf := make([]byte, length)
		_, err = io.ReadFull(reader, msgBuf)
		if err != nil {
			log.Printf("[fory] Error reading message: %v", err)
			return
		}

		// Decode Fory message
		var msg ForyMessage
		if err := s.fury.Unmarshal(msgBuf, &msg); err != nil {
			log.Printf("[fory] Error decoding message: %v", err)
			continue
		}

		// Handle the message
		response := s.handleMessage(msg)

		// Encode response
		respBuf, err := s.fury.Marshal(response)
		if err != nil {
			log.Printf("[fory] Error encoding response: %v", err)
			continue
		}

		// Write length prefix + response
		s.mu.Lock()
		binary.BigEndian.PutUint32(lengthBuf, uint32(len(respBuf)))
		conn.Write(lengthBuf)
		conn.Write(respBuf)
		s.mu.Unlock()
	}
}

func (s *ForyServer) handleMessage(msg ForyMessage) ForyResponse {
	// Convert to bridge Message format
	bridgeMsg := Message{
		ID:      msg.ID,
		Type:    msg.Type,
		Payload: msg.Payload,
	}

	// Use the bridge's existing message handler
	s.bridge.handleMessage(bridgeMsg)

	// For now, return success (the bridge handlers send responses via stdout in stdio mode,
	// but in fory mode we return directly)
	return ForyResponse{
		ID:      msg.ID,
		Success: true,
		Result:  make(map[string]interface{}),
	}
}

func (s *ForyServer) broadcastEvents() {
	for event := range s.eventChan {
		foryEvent := ForyEvent{
			Type:     event.Type,
			WidgetID: event.WidgetID,
			Data:     event.Data,
		}

		eventBuf, err := s.fury.Marshal(foryEvent)
		if err != nil {
			continue
		}

		lengthBuf := make([]byte, 4)
		binary.BigEndian.PutUint32(lengthBuf, uint32(len(eventBuf)))

		// Broadcast to all clients
		s.clients.Range(func(key, value interface{}) bool {
			conn := value.(net.Conn)
			s.mu.Lock()
			conn.Write(lengthBuf)
			conn.Write(eventBuf)
			s.mu.Unlock()
			return true
		})
	}
}
