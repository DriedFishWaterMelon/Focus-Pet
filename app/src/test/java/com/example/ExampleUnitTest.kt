package com.example

import com.example.service.UserProfile
import org.junit.Assert.*
import org.junit.Test

class ExampleUnitTest {
  @Test
  fun addition_isCorrect() {
    assertEquals(4, 2 + 2)
  }

  @Test
  fun testUserProfileDefaultAndCustom() {
    val defaultProfile = UserProfile()
    assertFalse(defaultProfile.isSignedIn)
    assertEquals("Focus Guardian", defaultProfile.displayName)
    assertEquals("Local", defaultProfile.authProvider)

    val googleProfile = UserProfile(
      uid = "g-12345",
      displayName = "Jane Doe",
      email = "jane.doe@gmail.com",
      photoUrl = "https://example.com/photo.jpg",
      isSignedIn = true,
      authProvider = "Google"
    )
    assertTrue(googleProfile.isSignedIn)
    assertEquals("Jane Doe", googleProfile.displayName)
    assertEquals("Google", googleProfile.authProvider)
    assertEquals("https://example.com/photo.jpg", googleProfile.photoUrl)
  }
}
