export default class Door extends Phaser.GameObjects.Container
{
    constructor (name, scene, x, y)
    {
        super(scene, x, y);

        this.name = name;

        this.background = scene.add.image(0, 0, 'https://labs.phaser.io/assets', 'doorBackground');
        this.door = scene.add.sprite(0, 0, 'https://labs.phaser.io/assets', 'door1');
        this.character = scene.add.image(0, 0, 'https://labs.phaser.io/assets', 'bandit1');
        this.characterFrame = 'bandit1';

        this.isOpen = false;
        this.isBandit = false;
        this.isHats = false;
        this.isDead = false;
        this.wasBandit = (scene.doors?.length % 2) ? true : false;

        this.hats = 0;
        this.timeToOpen = Number.MAX_SAFE_INTEGER;
        this.timeToClose = Number.MAX_SAFE_INTEGER;
        this.timeToKill = 0;

        this.characters = [
            'bandit1',
            'bandit2',
            'cowboy1',
            'cowboy2',
            'hat'
        ];

        this.add([ this.background, this.character, this.door ]);

        this.setSize(200, 400);
        this.setInteractive();
        this.on('pointerup', this.shoot, this);

        scene.add.existing(this);
    }

    start (time)
    {
        this.timeToOpen = time + Phaser.Math.RND.between(500, 4000);
    }

    reset (time)
    {
        this.isOpen = false;
        this.isBandit = false;
        this.isHats = false;
        this.isDead = false;

        this.door.play('doorClose');

        this.timeToOpen = time + Phaser.Math.RND.between(500, 4000);

        // <<< WICHTIG: Interaktion wieder aktivieren
        this.setInteractive();
    }

    openDoor (time)
    {
        this.isOpen = true;
        this.isBandit = false;
        this.isHats = false;
        this.isDead = false;

        this.characterFrame = Phaser.Utils.Array.GetRandom(this.characters);

        const duration = Phaser.Math.RND.between(
            this.scene.closeDurationLow,
            this.scene.closeDurationHigh
        );

        this.timeToClose = time + duration;

        if (this.characterFrame === 'bandit1' || this.characterFrame === 'bandit2')
        {
            this.isBandit = true;
        }
        else if (this.characterFrame === 'hat')
        {
            this.isHats = true;
            this.hats = Phaser.Math.RND.between(2, 5);
            this.characterFrame += this.hats.toString();
        }
        else
        {
            this.timeToClose = time + (duration / 2);
        }

        if (!this.wasBandit && !this.isBandit)
        {
            this.isHats = false;
            this.hats = 0;
            this.isBandit = true;
            this.characterFrame = (Math.random() > 0.5) ? 'bandit1' : 'bandit2';
            this.timeToClose = time + duration;
        }

        this.character.setFrame(this.characterFrame);
        this.character.setScale(1).setAlpha(1);

        if (this.isBandit)
        {
            this.timeToKill = time + (duration * this.scene.killDelay);
        }

        this.scene.sound.play('door');
        this.door.play('doorOpen');
    }

    closeDoor (time)
    {
        this.door.play('doorClose');

        this.isOpen = false;
        this.wasBandit = this.isBandit;

        // <<< HIER PASSIERT DIE GOLDVERGABE
        if (!this.isBandit && !this.isHats && !this.isDead)
        {
            this.scene.addGold(this.x, this.y);
        }

        this.timeToOpen = time + Phaser.Math.RND.between(2000, 4000);
    }

    shoot ()
    {
        if (!this.isOpen || this.scene.isPaused)
        {
            return;
        }

        this.scene.sound.play('shot');

        if (this.isDead) return;

        if (this.isBandit)
        {
            this.shootCharacter(true);
        }
        else
        {
            if (this.isHats)
            {
                this.shootHat();
            }
            else
            {
                this.shootCharacter(false);
            }
        }
    }

    shootCharacter (closeDoor)
    {
        this.isDead = true;

        this.characterFrame += 'Dead';
        this.character.setFrame(this.characterFrame);

        this.scene.sound.play('scream' + Phaser.Math.RND.between(1, 3));

        this.scene.tweens.add({
            targets: this.character,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 300,
            onComplete: () => {
                if (closeDoor)
                {
                    this.closeDoor(this.scene.game.getTime());
                }
                else
                {
                    this.scene.levelFail();
                }
            }
        });

        if (!closeDoor)
        {
            this.scene.isPaused = true;
        }
    }

    shootHat ()
    {
        if (this.hats > 0)
        {
            this.scene.addHat(this.x, this.y, this.hats);

            this.hats--;
            this.characterFrame = 'hat' + this.hats;
        }

        this.character.setFrame(this.characterFrame);
    }

    shootYou ()
    {
        this.scene.isPaused = true;

        this.scene.sound.play('banditShot');

        this.scene.killed(this.x, this.y);
    }

    update (time)
    {
        if (!this.isOpen && time >= this.timeToOpen)
        {
            this.openDoor(time);
        }
        else if (this.isOpen && time >= this.timeToClose)
        {
            this.closeDoor(time);
        }
        else if (this.isOpen && this.isBandit && !this.isDead && time >= this.timeToKill)
        {
            this.shootYou();
        }
    }
}
