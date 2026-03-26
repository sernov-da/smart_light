import 'package:flutter/material.dart';
import 'screens/device_list_screen.dart';
import 'screens/register_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Light Control',
      theme: ThemeData.dark(),
      home: const RegisterScreen(), // убрали const
    );
  }
}
