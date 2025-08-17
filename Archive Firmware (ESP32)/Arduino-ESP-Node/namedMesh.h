/**
 * Named Mesh Network Class for ESP32 Parking Sensor System
 * 
 * This class extends the painlessMesh library to provide named node
 * communication, making it easier to send messages to specific nodes
 * by name rather than by ID.
 * 
 * @author Raedam Team
 * @version 2.0.0
 * @since 2019
 */

#ifndef NAMED_MESH_H
#define NAMED_MESH_H

#include <map>
#include <functional>
#include "painlessMesh.h"

using namespace painlessmesh;

// ============================================================================
// Type Definitions
// ============================================================================

typedef std::function<void(String& from, String& msg)> NamedReceivedCallback_t;

// ============================================================================
// Named Mesh Class
// ============================================================================

/**
 * Extended mesh class with named node support
 */
class NamedMesh : public painlessMesh {
public:
  /**
   * Constructor
   */
  NamedMesh();
  
  /**
   * Destructor
   */
  ~NamedMesh() = default;
  
  /**
   * Get the current node name
   * @return Current node name as string
   */
  String getName() const;
  
  /**
   * Set the node name and start name broadcasting
   * @param name - New node name
   */
  void setName(const String& name);
  
  /**
   * Send message to a specific node by name
   * @param name - Target node name
   * @param msg - Message to send
   * @return true if sent successfully, false otherwise
   */
  bool sendSingle(const String& name, const String& msg);
  
  /**
   * Send message to a specific node by name (overload for char*)
   * @param name - Target node name
   * @param msg - Message to send
   * @return true if sent successfully, false otherwise
   */
  bool sendSingle(const char* name, const char* msg);
  
  /**
   * Get the number of connected nodes
   * @return Number of connected nodes
   */
  size_t getConnectedNodeCount() const;
  
  /**
   * Get list of connected node names
   * @return Vector of connected node names
   */
  std::vector<String> getConnectedNodeNames() const;
  
  /**
   * Check if a node is connected by name
   * @param name - Node name to check
   * @return true if connected, false otherwise
   */
  bool isNodeConnected(const String& name) const;
  
  /**
   * Get node ID by name
   * @param name - Node name
   * @return Node ID if found, 0 if not found
   */
  uint32_t getNodeIdByName(const String& name) const;
  
  /**
   * Get node name by ID
   * @param id - Node ID
   * @return Node name if found, empty string if not found
   */
  String getNodeNameById(uint32_t id) const;
  
  /**
   * Set callback for named message reception
   * @param callback - Function to call when named message is received
   */
  void onNamedReceive(NamedReceivedCallback_t callback);
  
  /**
   * Stop the mesh and cleanup resources
   */
  virtual void stop() override;

private:
  String nodeName;                    // Current node name
  bool nameBroadcastInit;             // Name broadcasting initialized flag
  Task nameBroadcastTask;             // Task for broadcasting node name
  std::map<uint32_t, String> nameMap; // Map of node IDs to names
  
  NamedReceivedCallback_t userNamedReceivedCallback; // User callback for named messages
  
  /**
   * Initialize name broadcasting task
   */
  void _initNameBroadcasting();
  
  /**
   * Broadcast node name to all connected nodes
   */
  void _broadcastNodeName();
  
  /**
   * Handle received messages and extract node names
   * @param from - Source node ID
   * @param msg - Received message
   */
  void _handleReceivedMessage(uint32_t from, String& msg);
  
  /**
   * Parse name broadcast message
   * @param msg - Message to parse
   * @return true if parsed successfully, false otherwise
   */
  bool _parseNameBroadcast(const String& msg);
  
  /**
   * Create name broadcast message
   * @return JSON formatted name broadcast message
   */
  String _createNameBroadcastMessage();
};

#endif // NAMED_MESH_H
