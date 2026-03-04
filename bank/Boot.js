export default class Boot extends Phaser.Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        this.load.setBaseURL('https://christoph-blank.github.io/game/');
        this.load.image('loading', 'bank-panic/loading.png');
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
