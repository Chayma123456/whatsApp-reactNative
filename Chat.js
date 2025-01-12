
import {
  View,
 Text,
 StyleSheet,
Image,
ImageBackground,
  TouchableHighlight,
 StatusBar,
 FlatList,
 KeyboardAvoidingView,
 Platform,
TouchableOpacity,
} from "react-native";
import { Linking } from "react-native";
import React, { useState, useEffect } from "react";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Button, TextInput } from "react-native-paper";
import firebase, { supabase } from "../config"; 

export default function Chat(props) {
 const [message, setMessage] = useState("");
const [messages, setMessages] = useState([]);
 const [uriLocalImage, seturiLocalImage] = useState();
 const [isDefaultImage, setisDefaultImage] = useState(true);
 const [isTyping, setIsTyping] = useState(false); // Track the other user's typing state

  const currentId = props.route.params.currentId;
const secondId = props.route.params.secondId;
const name = props.route.params.name;
useEffect(() => {
  const fetchMessages = async () => {
    const database = firebase.database();
      const ref_lesDiscutions = database.ref("lesdiscussions");

      if (!currentId || !secondId) {
        console.error("Error: Missing currentId or secondId");
        return;
      }

     const iddisc =
        currentId > secondId
         ? `${currentId}${secondId}`
          : `${secondId}${currentId}`;
    const ref_undiscution = ref_lesDiscutions.child(iddisc);

    const listener = ref_undiscution.on("value", (snapshot) => {
     const chatData = snapshot.val();
     if (chatData) {
        const formattedMessages = Object.entries(chatData).map(
         ([key, value]) => ({
           id: key,
          ...value,
        })
      );
        setMessages(formattedMessages);
      }    });

    return () => ref_undiscution.off("value", listener);
  };

   fetchMessages();
  }, [currentId, secondId]);

//  // Listen for typing status of the other user (secondId)
 useEffect(() => {
   const typingRef = firebase
     .database()
    .ref(`typing/${secondId}_${currentId}`); // Listen for typing from the second user
   const listener = typingRef.on("value", (snapshot) => {
    if (snapshot.exists()) {
      setIsTyping(snapshot.val()); // Set isTyping based on the other user's status
    } else {
     setIsTyping(false); // If no data exists, reset typing state
   }
 });

    return () => typingRef.off("value", listener);
  }, [currentId, secondId]);

  const handleSend = () => {
   if (!message.trim()) {
      alert("Message cannot be empty!");
    return;
}
   const sendMessageToFirebase = (messageData) => {
    try {
     const database = firebase.database();
      const ref_lesDiscutions = database.ref("lesdiscussions");
 
    if (!currentId || !secondId) {
        console.error("Error: Missing currentId or secondId");
       alert("Failed to send message. Invalid user IDs.");
       return;
       }   
       const iddisc =
         currentId > secondId
           ? `${currentId}${secondId}`
            : `${secondId}${currentId}`;
       const ref_undiscution = ref_lesDiscutions.child(iddisc);
       const key = ref_undiscution.push().key;
   
       ref_undiscution
               .child(key)
        .set(messageData)
        .catch((error) => {
          console.error("Error sending message:", error);
           alert("Failed to send message. Please try again.");
         });
             } catch (error) {
        console.error("Error in sendMessageToFirebase:", error);
      alert("An error occurred. Please try again later.");
      }
   };
    
    setMessage(""); // Clear input field after sending
    setIsTyping(false); // Reset typing state after sending message
   updateTypingStatus(false); // Update typing status to false
 };

  const handleSendLocation = async () => {
   try {
     const { status } = await Location.requestForegroundPermissionsAsync();
     if (status !== "granted") {
       alert("Permission to access location was denied");
        return;
     }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

     sendMessageToFirebase({
        message: `Location: https:www.google.com/maps?q=${latitude},${longitude}`,
       sender: currentId,
       receiver: secondId,
       time: new Date().toLocaleString(),
      location: { latitude, longitude }, 
     });
   } catch (error) {
      console.error("Error fetching location:", error);
     alert("Failed to get location. Please try again.");
   }
 };

 const sendMessageToFirebase = (messageData) => {
   try {
     const database = firebase.database();
     const ref_lesDiscutions = database.ref("lesDiscutions");
      if (!currentId || !secondId) {
        console.error("Error: Missing currentId or secondId");
        alert("Failed to send message. Invalid user IDs.");
        return;
      }

      const iddisc =
        currentId > secondId
          ? `${currentId}${secondId}`
          : `${secondId}${currentId}`;
      const ref_undiscution = ref_lesDiscutions.child(iddisc);
      const key = ref_undiscution.push().key;

      ref_undiscution
        .child(key)
        .set(messageData)
        .catch((error) => {
          console.error("Error sending message:", error);
          alert("Failed to send message. Please try again.");
        });
    } catch (error) {
      console.error("Error in sendMessageToFirebase:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  const updateTypingStatus = (status) => {
    const typingRef = firebase.database().ref(`typing/${currentId}_${secondId}`);
    typingRef.set(status);
  };

  const handleTyping = (text) => {
    setMessage(text);
    if (text.length > 0) {
      updateTypingStatus(true); // Update typing status when user is typing
    } else {
      updateTypingStatus(false);  //Reset typing status when input is empty
    }
  };

  const uploadImage = async (uri, userId) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();

    // Use userId instead of currentId
    await supabase.storage
      .from("profilImage")
      .upload("image" + userId, arraybuffer);

    const { data } = supabase.storage
      .from("profilImage")
      .getPublicUrl("image" + userId);

    return data.publicUrl;
  };

  const pickImage = async () => {
    // Request permission to access the image library
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access gallery is required!");
      return;
    }
  
    // Launch image picker if permission granted
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled) {
      setisDefaultImage(false);
      seturiLocalImage(result.assets[0].uri);  //Set URI for the image
      uploadImage(result.assets[0].uri);  //Upload image once selected
    }
  };
  return (
    <ImageBackground
      source={require("../assets/flower.jpg")}
      blurRadius={3}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.textStyle}>Chat with {name}</Text>

      <FlatList
  data={[...messages].reverse()}  Reverse the messages array
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === currentId ? styles.myMessage : styles.otherMessage,
      ]}
    >
      {item.message.startsWith("http") ? (
         //Display image if the message contains a URL
        <Image
          source={{ uri: item.message }}
          style={{ width: 200, height: 200, borderRadius: 10 }}
        />
      ) : (
        <Text style={styles.messageText}>{item.message}</Text>
      )}
      <Text style={styles.timestamp}>{item.time}</Text>
    </View>
  )}
 // inverted  This inverts the FlatList
  style={{ flex: 1, width: "100%" }}
  contentContainerStyle={{ padding: 10 }}
/>


      {isTyping && (
        <Text style={styles.typingText}>{name} is typing...</Text>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
        style={styles.inputContainer}
      >
        <TextInput
          onChangeText={handleTyping}
          value={message}
          style={styles.textInput}
          placeholder="Type your message"
        />
        <Button onPress={handleSend} style={styles.sendButton}>
          Send
        </Button>

        <TouchableHighlight
          onPress={() => {
            pickImage();
          }}
        >
          <Image
            source={
              isDefaultImage
                ? require("../assets/flower.jpg")
                : { uri: uriLocalImage }
            }
            style={styles.imageStyle}
          />
        </TouchableHighlight>

        <TouchableHighlight onPress={handleSendLocation}>
          <Text>📍</Text>
        </TouchableHighlight>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  textStyle: {
    fontSize: 32,
    color: "#fff",
    marginTop: 35,
    marginVertical: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: "80%",
    borderRadius: 20,
    padding: 10,
    backgroundColor: "#c6a3c6",
  },
  myMessage: {
    backgroundColor: "#d8b7d8",
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "#e1bee7",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#000",
  },
  timestamp: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "right",
  },
  typingText: {
    color: "#888",
    fontStyle: "italic",
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#fff",
  },
  sendButton: {
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
  imageStyle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
