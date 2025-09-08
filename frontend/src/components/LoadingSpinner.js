import React from "react";
import { Spinner, VStack, Text, Box } from "@chakra-ui/react";

const LoadingSpinner = ({
  size = "xl",
  message = "Loading...",
  color = "brand.500",
  showMessage = true,
}) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minH="200px"
      w="100%"
    >
      <VStack spacing={4}>
        <Spinner size={size} color={color} thickness="4px" />
        {showMessage && (
          <Text color="gray.600" fontSize="sm">
            {message}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default LoadingSpinner;
