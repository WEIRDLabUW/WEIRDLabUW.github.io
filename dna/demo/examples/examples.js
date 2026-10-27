// Example predictions, keyed by name. Each value has the shape the "Copy all" button produces.
window.DNA_EXAMPLE_PREDICTIONS = {
  "balance-ball-failure": {
    "meta": {
      "task": "balance on top of the ball",
      "mode": "dna_feedback",
      "model": "placeholder",
      "timestamps": [
        0.0,
        0.263,
        0.527,
        0.79,
        1.053,
        1.317,
        1.58,
        1.843,
        2.107,
        2.37,
        2.633,
        2.897,
        3.16,
        3.423,
        3.687,
        3.95
      ],
      "placeholder": true
    },
    "objects": {
      "all_objects": [
        "robot dog",
        "blue exercise ball",
        "person in white t-shirt",
        "person in blue shirt",
        "cord"
      ],
      "task_objects": [
        "robot dog",
        "blue exercise ball"
      ]
    },
    "descriptions": {
      "description_first_frame": "A robot dog stands on top of a large blue exercise ball outdoors. Two people stand to the left; one in a white t-shirt, one in a light-blue shirt holding a leash-like cord toward the robot.",
      "description_last_frame": "The robot is off the top of the ball and beside it near the ground; the people stand next to it.",
      "descriptions": [
        "A robot dog stands on top of a large blue exercise ball outdoors. Two people stand to the left; one in a white t-shirt, one in a light-blue shirt holding a leash-like cord toward the robot.",
        "The robot dog is still on top of the ball. The person in white steps toward the ball and the person in blue stands close to it.",
        "The robot remains on top of the ball, body roughly level. The person in white is next to the ball, one foot forward.",
        "The robot is on the ball but its body is shifting slightly to the right; the ball has rolled a little.",
        "The ball is rolling to the right and the robot's legs are adjusting on top of it.",
        "The robot is on the ball, leaning to one side while the ball continues to roll.",
        "The robot tilts further toward the right side of the ball; the person in blue holds the cord taut.",
        "The robot's body is tilted and its front legs are sliding down the side of the ball.",
        "The robot is at the upper-right edge of the ball, no longer centered on top.",
        "The robot is partly over the side of the ball and leaning sharply; the person in white walks behind the ball.",
        "The robot is mostly on the side of the ball, with its legs hanging down toward the ground.",
        "The robot is sliding down the right side of the ball; the cord is pulled taut by the person in blue.",
        "The robot is on the lower right side of the ball, almost off it.",
        "The robot is below the top of the ball, touching it only with its legs and body side.",
        "The robot is hanging off the side of the ball, close to the ground.",
        "The robot is off the top of the ball and beside it near the ground; the people stand next to it."
      ]
    },
    "success": {
      "success criteria": "The robot dog stays upright on the top of the blue exercise ball for the whole video."
    },
    "reward": {
      "failure": "The robot slides off the side of the ball and ends up on the ground beside it.",
      "feedback": "Keep the body centered over the ball and shift weight against the roll direction instead of leaning with it.",
      "completion state": "The robot dog stays upright on the top of the blue exercise ball for the whole video.",
      "progress": [
        100,
        95,
        90,
        90,
        86,
        82,
        76,
        72,
        62,
        56,
        46,
        40,
        26,
        14,
        6,
        0
      ]
    }
  }
};
